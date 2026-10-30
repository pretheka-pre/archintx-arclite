import re
from typing import List, Optional
from dataclasses import dataclass
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer, ENGLISH_STOP_WORDS
from sklearn.metrics.pairwise import cosine_similarity
from backend.app.config import settings
from backend.app.models import FAQEntry

@dataclass
class MatchResult:
    verdict: str  # "Answered", "Refused", "Unclear"
    answer: str
    category: Optional[str]
    confidence_score: float
    matched_faq_id: Optional[int] = None

REFUSAL_MESSAGE = (
    "I'm sorry, I don't have verified information about that. "
    "Please contact the ArchintX support team."
)

UNCLEAR_MESSAGE = (
    "Your question appears ambiguous and could relate to multiple topics. "
    "Could you please clarify your request, or specify if you are asking about "
    "Courses, Certificates, Jobs, or your Account?"
)

# Custom domain stopwords to prevent company brand name or greetings from falsifying intent
CUSTOM_STOPWORDS = list(
    ENGLISH_STOP_WORDS.union({
        "archintx", "archint", "company", "service", "services",
        "hello", "hi", "hey", "tell", "need", "want"
    })
)

def clean_text(text: str) -> str:
    """Preprocess text by lowercasing and normalizing whitespace."""
    if not text:
        return ""
    text = text.lower().strip()
    text = re.sub(r"\s+", " ", text)
    return text

def build_faq_corpus_doc(faq: FAQEntry) -> str:
    """
    Build a focused textual document for an FAQ entry based on stored FAQ trigger keywords.
    Keywords are the authoritative triggers matching user intent.
    """
    cleaned_keywords = clean_text(faq.keywords or "")
    cleaned_category = clean_text(faq.category or "")
    # Combine keywords with category context
    return f"{cleaned_keywords} {cleaned_category}"

class FAQMatcher:
    def __init__(
        self,
        high_confidence_threshold: Optional[float] = None,
        low_confidence_threshold: Optional[float] = None,
        ambiguity_margin: Optional[float] = None
    ):
        self.high_confidence_threshold = (
            high_confidence_threshold if high_confidence_threshold is not None else settings.HIGH_CONFIDENCE_THRESHOLD
        )
        self.low_confidence_threshold = (
            low_confidence_threshold if low_confidence_threshold is not None else settings.LOW_CONFIDENCE_THRESHOLD
        )
        self.ambiguity_margin = (
            ambiguity_margin if ambiguity_margin is not None else settings.AMBIGUITY_MARGIN
        )

    def match(self, question: str, faqs: List[FAQEntry]) -> MatchResult:
        cleaned_question = clean_text(question)

        # Immediate refusal for empty, whitespace, or trivially short input
        if not cleaned_question or len(cleaned_question) < 3 or not faqs:
            return MatchResult(
                verdict="Refused",
                answer=REFUSAL_MESSAGE,
                category=None,
                confidence_score=0.0,
                matched_faq_id=None
            )

        # Prepare corpus from current FAQs in database
        faq_docs = [build_faq_corpus_doc(faq) for faq in faqs]

        # Use TF-IDF vectorizer with domain stop words
        vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words=CUSTOM_STOPWORDS,
            norm="l2"
        )

        try:
            faq_matrix = vectorizer.fit_transform(faq_docs)
            question_vec = vectorizer.transform([cleaned_question])
        except (ValueError, Exception):
            return MatchResult(
                verdict="Refused",
                answer=REFUSAL_MESSAGE,
                category=None,
                confidence_score=0.0,
                matched_faq_id=None
            )

        # Calculate cosine similarities
        similarities = cosine_similarity(question_vec, faq_matrix).flatten()

        if len(similarities) == 0:
            return MatchResult(
                verdict="Refused",
                answer=REFUSAL_MESSAGE,
                category=None,
                confidence_score=0.0,
                matched_faq_id=None
            )

        # Rank indices by descending similarity score
        sorted_indices = np.argsort(similarities)[::-1]
        top_idx = sorted_indices[0]
        top_score = float(similarities[top_idx])

        # Rule 1: Refused - Completely unrelated question or below minimal relevance threshold
        if top_score < self.low_confidence_threshold:
            return MatchResult(
                verdict="Refused",
                answer=REFUSAL_MESSAGE,
                category=None,
                confidence_score=round(top_score, 4),
                matched_faq_id=None
            )

        # Rule 2: Unclear - Low-confidence match (between low and high thresholds)
        if top_score < self.high_confidence_threshold:
            return MatchResult(
                verdict="Unclear",
                answer=UNCLEAR_MESSAGE,
                category=None,
                confidence_score=round(top_score, 4),
                matched_faq_id=None
            )

        # Rule 3: Unclear - Ambiguous match if runner-up is also confident and close in score
        if len(sorted_indices) > 1:
            runner_up_idx = sorted_indices[1]
            runner_up_score = float(similarities[runner_up_idx])

            # If both top entries are high-confidence and score difference is within ambiguity margin
            if runner_up_score >= self.high_confidence_threshold:
                score_diff = top_score - runner_up_score
                top_faq = faqs[top_idx]
                runner_up_faq = faqs[runner_up_idx]

                # If distinct FAQs
                if score_diff <= self.ambiguity_margin and (
                    top_faq.id != runner_up_faq.id and top_faq.canonical_answer != runner_up_faq.canonical_answer
                ):
                    return MatchResult(
                        verdict="Unclear",
                        answer=UNCLEAR_MESSAGE,
                        category=None,
                        confidence_score=round(top_score, 4),
                        matched_faq_id=None
                    )

        # Rule 4: Answered - High confidence and unambiguous match
        best_faq = faqs[top_idx]
        return MatchResult(
            verdict="Answered",
            answer=best_faq.canonical_answer,
            category=best_faq.category,
            confidence_score=round(top_score, 4),
            matched_faq_id=best_faq.id
        )

faq_matcher = FAQMatcher()
