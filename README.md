# Arc Lite – AI-Powered FAQ Assistant
### Intelligent Knowledge Assistant for ArchintX

**Arc Lite** is a production-quality, enterprise-grade AI FAQ assistant engineered for **ArchintX**. Built with a strict **anti-hallucination architecture**, Arc Lite never fabricates facts, company policies, courses, certificates, jobs, or accounts. Instead, it utilizes **TF-IDF vectorization and cosine similarity** against verified canonical database records to deliver confident answers, ask for clarification when queries are ambiguous, and decisively refuse out-of-scope inquiries.

---

##  Key Features

### 1. Public Chatbot Assistant
- **Zero Login Barrier**: Freely accessible to students and visitors.
- **Strict Anti-Hallucination Matching**: High-confidence matches return canonical answers, ambiguous requests prompt clarification (`Unclear`), and irrelevant queries are rejected (`Refused`).
- **Telemetry & Category Metadata**: Displays the matched FAQ category (Courses, Certificates, Jobs, Account), verdict status badge, and real-time inference latency (in ms).
- **Interactive Feedback**: 1-click Thumbs-Up and Thumbs-Down rating buttons directly linked to conversation records.
- **Session History & Quick Starters**: Quick-action prompt chips and session memory.

### 2. Staff Authentication & Protected Portal
- **JWT Authentication**: Argon2 password hashing and secure Bearer tokens.
- **Seeded Administration**: Automated, secure seeding of staff credentials from environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).
- **Protected Routing**: Unauthorized visitors are prevented from accessing staff tools.

### 3. FAQ Knowledge Base Management
- **Full CRUD Support**: Add, edit, delete, search, and filter FAQ entries.
- **Immediate Live Effect**: Changes to trigger keywords or canonical answers update the chatbot matching system without application restart.
- **4 Standard Categories**: Courses, Certificates, Jobs, and Account.

### 4. Dynamic Analytics & Audit Dashboard
- **100% Real Database Telemetry**: Computes metrics on-the-fly directly from the `conversations` table—never mock data.
- **Interactive Visualizations (Recharts)**:
  1. Verdict distribution by category.
  2. Average latency / response time by category.
  3. Quality audit of answered queries down-voted by users.
- **Detailed Human Review Table**: Filter and inspect every conversation where an answered query received a thumbs-down rating for continuous knowledge base refinement.

---

##  Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS, Lucide React, Axios, Recharts |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2, SQLAlchemy 2 |
| **AI Matching** | Scikit-Learn (`TfidfVectorizer`, Cosine Similarity), NumPy |
| **Database** | PostgreSQL (Neon, Supabase) / SQLite (Zero-config local development) |
| **Authentication** | JWT (`PyJWT`), Argon2 (`argon2-cffi`) |
| **Testing** | Pytest, FastAPI TestClient, HTTPX |
| **Deployment** | Vercel / Netlify (Frontend), Render / Railway / Docker (Backend) |

---

##  Project Structure

```text
archintX/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py             # App settings & threshold configuration
│   │   ├── database.py           # SQLAlchemy engine & session manager
│   │   ├── models.py             # FAQEntry, Conversation, Staff DB models
│   │   ├── schemas.py            # Pydantic validation schemas
│   │   ├── auth.py               # Argon2 password hashing & JWT handling
│   │   ├── matcher.py            # TF-IDF cosine similarity anti-hallucination engine
│   │   ├── seed.py               # 13+ production FAQs & staff account seeder
│   │   ├── main.py               # FastAPI application & CORS setup
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── chat.py           # POST /chat, POST /chat/{id}/rate
│   │       ├── auth.py           # POST /auth/login, GET /auth/me
│   │       └── admin.py          # /admin/faq, /admin/stats
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_all.py           # Comprehensive pytest suite (13 test cases)
│   ├── Dockerfile                # Production container specification
│   ├── Procfile                  # Platform-as-a-Service runner
│   └── requirements.txt          # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts         # Axios client with JWT interceptor
│   │   │   └── types.ts          # TypeScript interfaces & types
│   │   ├── context/
│   │   │   └── AuthContext.tsx   # Global authentication state
│   │   ├── components/
│   │   │   ├── Navbar.tsx        # Responsive navigation & portal switch
│   │   │   ├── VerdictBadge.tsx  # Answered / Refused / Unclear badges
│   │   │   └── CategoryBadge.tsx # Courses / Certificates / Jobs / Account badges
│   │   ├── pages/
│   │   │   ├── ChatPage.tsx      # Public FAQ chatbot interface
│   │   │   ├── LoginPage.tsx     # Staff sign-in view
│   │   │   ├── FaqManagement.tsx # Staff FAQ editor & keyword manager
│   │   │   └── AnalyticsPage.tsx # Real-time telemetry & review table
│   │   ├── App.tsx               # View routing and layout wrapper
│   │   ├── main.tsx              # React DOM entrypoint
│   │   └── index.css             # Tailwind base & custom scrollbar
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── vercel.json               # SPA routing configuration
├── render.yaml                   # Infrastructure-as-code for Render
├── .env.example                  # Environment variables template
└── README.md                     # Documentation
```

---

##  Database Architecture & ER Diagram

```mermaid
erDiagram
    STAFF {
        int id PK
        string email UK
        string password_hash
        datetime created_at
    }

    FAQ_ENTRIES {
        int id PK
        string category
        text keywords
        text canonical_answer
        datetime created_at
        datetime updated_at
    }

    CONVERSATIONS {
        int id PK
        text question
        text answer
        string category
        string verdict
        int response_time_ms
        string rating
        datetime created_at
    }
```

### Table Descriptions
1. **`faq_entries`**: Stored canonical answers and keyword triggers indexed by category (`Courses`, `Certificates`, `Jobs`, `Account`).
2. **`conversations`**: Immutable audit log of every question, response verdict, latency in milliseconds, user feedback (`up`, `down`, or `null`), and timestamp.
3. **`staff`**: Staff credentials secured with salted Argon2 password hashes.

---

##  AI Matching Algorithm & Anti-Hallucination Design

### Workflow
```mermaid
flowchart TD
    A["User submits question"] --> B["Preprocess & clean text (strip, lowercase)"]
    B --> C["Fetch live FAQ entries from database"]
    C --> D["Build TF-IDF matrix using n-grams (1, 2) & domain stopwords"]
    D --> E["Compute Cosine Similarity between question and all FAQs"]
    E --> F["Extract Top Score (S1) and Runner-up Score (S2)"]
    F --> G{"Is S1 < Low Confidence Threshold?"}
    G -- "Yes" --> H["Verdict: Refused<br/>'I don't have verified information about that.'"]
    G -- "No" --> I{"Is S1 < High Confidence Threshold?"}
    I -- "Yes" --> J["Verdict: Unclear<br/>'Query ambiguous / limited detail. Please clarify.'"]
    I -- "No" --> K{"Is (S1 - S2) <= Ambiguity Margin?"}
    K -- "Yes" --> J
    K -- "No" --> L["Verdict: Answered<br/>Return Canonical Database Answer"]
```

### Confidence Threshold Breakdown
- **`HIGH_CONFIDENCE_THRESHOLD` (Default: `0.25`)**: Requires sufficient term overlap and n-gram alignment before a canonical answer is declared.
- **`LOW_CONFIDENCE_THRESHOLD` (Default: `0.08`)**: Differentiates general related terms from completely foreign out-of-scope queries (e.g. general knowledge, stock prices, recipes).
- **`AMBIGUITY_MARGIN` (Default: `0.05`)**: When two distinct FAQs score nearly identically above the high-confidence threshold (e.g. "Tell me about your programs"), the system avoids guessing and requests clarification (`Unclear`).

---

##  API Endpoint Documentation

### Public Endpoints

#### `POST /chat`
Submits a question to the assistant.
- **Request**:
  ```json
  {
    "question": "How can I enroll in a course?"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "conversation_id": 1,
    "answer": "To enroll in an ArchintX course, navigate to our Course Catalog, select your desired track (AI Engineering, Full Stack, or Cloud Architecture), and click 'Enroll Now'. Complete the registration form and tuition checkout to gain immediate access to the course portal.",
    "category": "Courses",
    "verdict": "Answered",
    "response_time_ms": 32
  }
  ```

#### `POST /chat/{id}/rate`
Records user satisfaction (`up` or `down`).
- **Request**:
  ```json
  {
    "rating": "up"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "status": "success",
    "conversation_id": 1,
    "rating": "up"
  }
  ```

---

### Staff & Protected Endpoints

#### `POST /auth/login`
Authenticates staff members.
- **Request**:
  ```json
  {
    "email": "admin@archintx.com",
    "password": "ArchintX2026!Secure"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "email": "admin@archintx.com"
  }
  ```

#### `GET /admin/faq` *(Bearer Auth)*
Lists FAQs. Supports `?category=Courses` and `?search=enroll`.

#### `POST /admin/faq` *(Bearer Auth)*
Creates a new FAQ entry (`201 Created`).

#### `PUT /admin/faq/{id}` *(Bearer Auth)*
Updates existing FAQ keywords or canonical text.

#### `DELETE /admin/faq/{id}` *(Bearer Auth)*
Removes an FAQ entry.

#### `GET /admin/stats` *(Bearer Auth)*
Returns dynamic summary metrics, verdict distributions, latency averages, and down-voted answered conversations.

---

##  Local Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
# 1. Create and activate virtual environment
python -m venv .venv

# Windows
.\.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Seed database (creates tables, admin account, and 13+ standard FAQs)
python -m backend.app.seed

# 4. Start backend server
uvicorn backend.app.main:app --reload --port 8000
```
Backend API will be accessible at `http://localhost:8000` (Interactive docs at `http://localhost:8000/docs`).

### 2. Frontend Setup
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```
Frontend web application will open at `http://localhost:5173`.

---

##  Running the Test Suite

The backend contains a test suite covering all matching verdicts, anti-hallucination guarantees, authentication, feedback, and telemetry calculations:

```bash
# Run backend tests
.\.venv\Scripts\python -m pytest -v backend/tests/test_all.py
```

### Test Coverage Highlights:
- `test_successful_faq_matching`: Verified questions return `Answered` and canonical content.
- `test_unrelated_question_refusal`: Out-of-scope inquiries ("What is the capital of Japan?") return `Refused`.
- `test_anti_hallucination_guarantee`: Bait queries (stock prices, black holes, cake recipes, poems) are refused.
- `test_ambiguous_question_handling`: Ambiguous queries ("Tell me about your programs") return `Unclear`.
- `test_missing_input_validation`: Empty inputs return HTTP 400/422.
- `test_conversation_logging`: Verifies persistence of queries and latency in the database.
- `test_thumbs_up_feedback` & `test_thumbs_down_feedback`: Verifies user rating mutation.
- `test_staff_authentication_success` & `test_staff_authentication_invalid_credentials`: Verifies JWT issuance and 401 handling.
- `test_unauthorized_admin_access`: Protected endpoints reject requests without a valid Bearer token.
- `test_faq_creation_and_editing`: Verifies that adding and editing an FAQ immediately affects chatbot matching.
- `test_analytics_calculations`: Verifies live statistics computation from database records.

---

##  Deployment Instructions

### Deploying Frontend (Vercel)
1. Push this repository to GitHub.
2. In Vercel, import the repository and set the **Root Directory** to `frontend`.
3. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-backend-service.onrender.com`
4. Deploy! `frontend/vercel.json` ensures client-side routing works seamlessly.

### Deploying Backend (Render / Railway)
1. In Render, select **New Web Service** and link your repository.
2. Set Environment to `Python 3`.
3. Build Command: `pip install -r backend/requirements.txt`
4. Start Command: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
5. Set Environment Variables:
   - `DATABASE_URL`: Your Supabase or Neon PostgreSQL connection string (e.g. `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require`)
   - `JWT_SECRET_KEY`: A secure 32+ character random secret
   - `ADMIN_EMAIL`: Staff email (e.g. `admin@archintx.com`)
   - `ADMIN_PASSWORD`: Secure staff password
   - `FRONTEND_URL`: `https://your-frontend.vercel.app`
6. Deploy! On startup, tables and seed data will be automatically created.

---

##  Security Best Practices
- **Never Log Secrets**: Passwords are never logged or stored in plain-text.
- **Argon2id Hashing**: Protected against GPU-accelerated brute force attacks.
- **Stateless JWT**: Cryptographically signed tokens with strict expiration.
- **SQL Injection Immune**: All queries use SQLAlchemy ORM parameterization.
- **CORS Hardened**: Restricted to authorized origins in production.
