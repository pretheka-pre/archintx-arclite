import logging
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.database import SessionLocal, Base, engine
from backend.app.models import Staff, FAQEntry
from backend.app.auth import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

INITIAL_FAQS = [
    # ── Courses ──────────────────────────────────────────────────────────────
    {
        "category": "Courses",
        "keywords": (
            "enroll course programs registration sign up join class batch admission "
            "start learning register study tracks offerings curriculum how enroll "
            "how to enroll how join how register how start how sign up"
        ),
        "canonical_answer": (
            "To enroll in an ArchintX course, navigate to our Course Catalog, select your "
            "desired track (AI Engineering, Full Stack, or Cloud Architecture), and click "
            "'Enroll Now'. Complete the registration form and tuition checkout to gain "
            "immediate access to the course portal."
        )
    },
    {
        "category": "Courses",
        "keywords": (
            "prerequisite requirements prior knowledge background coding beginner "
            "experience skill level difficulty what do i need before starting required "
            "skills needed prerequisites before starting"
        ),
        "canonical_answer": (
            "Most foundational courses require basic programming familiarity (such as Python "
            "or JavaScript). Advanced specializations like Advanced AI Systems recommend prior "
            "exposure to linear algebra, data structures, and modern web frameworks."
        )
    },
    {
        "category": "Courses",
        "keywords": (
            "course structure schedule self paced live recordings timing flexible access "
            "lifetime curriculum duration hours timeline syllabus format modules weekly "
            "how long does course take course format how course structured"
        ),
        "canonical_answer": (
            "ArchintX offers hybrid learning: all core video modules, interactive code "
            "repositories, and hands-on labs are 100% self-paced with lifetime access. "
            "Live mentor Q&A sessions are held weekly on Tuesday and Thursday evenings "
            "with recorded playbacks available."
        )
    },
    {
        "category": "Courses",
        "keywords": (
            "refund policy money back cancel course cancellation guarantee tuition refund "
            "terms billing dispute return can i get refund how refund"
        ),
        "canonical_answer": (
            "ArchintX provides a 14-day 100% money-back guarantee for all course enrollments, "
            "provided you have completed less than 25% of the curriculum content."
        )
    },
    {
        "category": "Courses",
        "keywords": (
            "course fees tuition cost enrollment fee payment plan installment installments "
            "financial aid scholarship how much does course cost can i pay monthly "
            "pay installments afford fees pricing"
        ),
        "canonical_answer": (
            "ArchintX course tuition ranges from $499 to $1,499 depending on the specialization "
            "track. We provide flexible 3-month interest-free installment plans and need-based "
            "scholarships."
        )
    },

    # ── Certificates ──────────────────────────────────────────────────────────
    {
        "category": "Certificates",
        "keywords": (
            "receive certificate course completion diploma download issue timeline "
            "when get credential accredited credentials awards how long certificate "
            "when will i receive my certificate when do i get certificate "
            "how long does it take to get certificate after completing"
        ),
        "canonical_answer": (
            "Upon completing all mandatory assignments, quizzes, and capstone project reviews "
            "with a passing grade of 80% or higher, your digital certificate is automatically "
            "generated and available for PDF download within 24 hours."
        )
    },
    {
        "category": "Certificates",
        "keywords": (
            "verify certificate verification authenticity validate credential id check "
            "employer valid inspect record how do employers verify certificate "
            "is certificate authentic proof real certificate authentic"
        ),
        "canonical_answer": (
            "Every ArchintX certificate includes a unique tamper-proof verification ID and "
            "QR code. Employers and educational institutions can instantly verify credentials "
            "at archintx.com/verify by entering the Certificate ID."
        )
    },
    {
        "category": "Certificates",
        "keywords": (
            "linkedin share resume social media add certificate credential export badge "
            "digital credential showcase how add certificate linkedin how share certificate "
            "add certificate to linkedin profile"
        ),
        "canonical_answer": (
            "Yes! Your digital certificate page includes a 1-click 'Add to LinkedIn Profile' "
            "button which automatically fills the issuing organization, issue date, credential "
            "ID, and direct verification URL."
        )
    },

    # ── Jobs ──────────────────────────────────────────────────────────────────
    {
        "category": "Jobs",
        "keywords": (
            "job placement assistance career support hiring hiring partners interview "
            "resume review job guarantee employment recruit recruiting does archintx "
            "help find job job help career help get hired"
        ),
        "canonical_answer": (
            "ArchintX Career Services offers 1-on-1 resume reviews, mock technical "
            "interviews, LinkedIn profile optimization, and direct referrals through our "
            "network of over 120 hiring partners across the tech industry."
        )
    },
    {
        "category": "Jobs",
        "keywords": (
            "internship opportunities apprentice practical work experience summer project "
            "industry placement junior developer apprentice program are there internships "
            "can i get internship"
        ),
        "canonical_answer": (
            "Top-performing graduates of our professional tracks are eligible for 3-month paid "
            "industry apprenticeships and project internships with our partner tech firms and "
            "incubators."
        )
    },
    {
        "category": "Jobs",
        "keywords": (
            "career coaching mentor 1-on-1 guidance advisor interview preparation "
            "salary negotiation job hunt strategy mock interview does archintx offer "
            "mentorship career mentorship coaching mentorship"
        ),
        "canonical_answer": (
            "Enrolled career-track students are paired with a dedicated industry mentor who "
            "conducts bi-weekly 1-on-1 coaching sessions covering technical interview prep, "
            "portfolio curation, and salary negotiation strategies."
        )
    },

    # ── Account ───────────────────────────────────────────────────────────────
    {
        "category": "Account",
        "keywords": (
            "reset password forgot password change login credentials recovery email link "
            "authentication login issue sign in problem how reset password how change password "
            "i forgot my password can not login"
        ),
        "canonical_answer": (
            "To reset your password, click 'Forgot Password' on the login screen, enter your "
            "registered email address, and follow the secure reset link sent to your inbox. "
            "The link expires in 30 minutes."
        )
    },
    {
        "category": "Account",
        "keywords": (
            "update profile change email edit name personal details settings account "
            "information avatar display name how update profile how change email "
            "how edit account"
        ),
        "canonical_answer": (
            "Log in to your ArchintX account and go to Settings > Profile. From there, you "
            "can update your display name, biography, avatar, and contact email. Email changes "
            "require verification from your new address."
        )
    },
    {
        "category": "Account",
        "keywords": (
            "delete account remove profile gdpr export data privacy close account "
            "purge information termination how delete account can i delete account "
            "how close account"
        ),
        "canonical_answer": (
            "You can request account deletion or data export under Settings > Security & "
            "Privacy. Once confirmed, all personal identifiable data will be permanently "
            "purged in accordance with our GDPR privacy policy within 30 days."
        )
    }
]

def seed_database(db: Session):
    """Seed initial staff account and standard FAQ entries if missing."""
    # 1. Staff seeding
    admin_email = settings.ADMIN_EMAIL.strip().lower()
    staff = db.query(Staff).filter(Staff.email == admin_email).first()
    if not staff:
        logger.info(f"Seeding default staff user: {admin_email}")
        staff = Staff(
            email=admin_email,
            password_hash=hash_password(settings.ADMIN_PASSWORD)
        )
        db.add(staff)
        db.commit()
    else:
        logger.info(f"Staff user already exists: {admin_email}")

    # 2. FAQ seeding
    existing_count = db.query(FAQEntry).count()
    if existing_count == 0:
        logger.info(f"Seeding {len(INITIAL_FAQS)} initial FAQ entries...")
        for faq_data in INITIAL_FAQS:
            faq = FAQEntry(
                category=faq_data["category"],
                keywords=faq_data["keywords"],
                canonical_answer=faq_data["canonical_answer"]
            )
            db.add(faq)
        db.commit()
        logger.info("FAQ database successfully seeded.")
    else:
        logger.info(f"FAQ entries already exist ({existing_count} records). Skipping FAQ seed.")

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
