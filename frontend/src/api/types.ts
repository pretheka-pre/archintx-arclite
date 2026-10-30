export type FAQCategory = 'Courses' | 'Certificates' | 'Jobs' | 'Account';

export type VerdictType = 'Answered' | 'Refused' | 'Unclear';

export type RatingType = 'up' | 'down';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  category?: FAQCategory | string | null;
  verdict?: VerdictType;
  responseTimeMs?: number;
  conversationId?: number;
  rating?: RatingType | null;
  timestamp: string;
}

export interface ChatRequestPayload {
  question: string;
}

export interface ChatResponsePayload {
  conversation_id: number;
  answer: string;
  category: FAQCategory | null;
  verdict: VerdictType;
  response_time_ms: number;
}

export interface RateRequestPayload {
  rating: RatingType;
}

export interface RateResponsePayload {
  status: string;
  conversation_id: number;
  rating: RatingType;
}

export interface LoginRequestPayload {
  email: string;
  password: string;
}

export interface TokenResponsePayload {
  access_token: string;
  token_type: string;
  email: string;
}

export interface FAQItem {
  id: number;
  category: FAQCategory | string;
  keywords: string;
  canonical_answer: string;
  created_at: string;
  updated_at: string;
}

export interface FAQCreatePayload {
  category: string;
  keywords: string;
  canonical_answer: string;
}

export interface FAQUpdatePayload {
  category?: string;
  keywords?: string;
  canonical_answer?: string;
}

export interface ConversationRecord {
  id: number;
  question: string;
  answer: string;
  category: string | null;
  verdict: VerdictType;
  response_time_ms: number;
  rating: RatingType | null;
  created_at: string;
}

export interface CategoryVerdictStat {
  category: string;
  answered: number;
  refused: number;
  unclear: number;
  total: number;
}

export interface CategoryResponseTimeStat {
  category: string;
  avg_response_time_ms: number;
  count: number;
}

export interface StatsSummary {
  total_conversations: number;
  total_answered: number;
  total_refused: number;
  total_unclear: number;
  total_positive: number;
  total_negative: number;
}

export interface StatsResponsePayload {
  summary: StatsSummary;
  verdict_by_category: CategoryVerdictStat[];
  response_time_by_category: CategoryResponseTimeStat[];
  answered_down_conversations: ConversationRecord[];
  recent_conversations: ConversationRecord[];
}
