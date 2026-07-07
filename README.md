# 🏥 MedSync AI - Telemedicine Platform

A next-generation telemedicine platform that integrates real-time video consultations with certified doctors and AI-powered medical assistance to ensure 24/7 healthcare accessibility for everyone.

---

## 🚀 Features

### 🌐 For Patients

- **Doctor Discovery**: Filter and find doctors by specialty, ratings, language, and live availability.
- **Appointment Booking**: Schedule real-time consultations with secure payment support.
- **Live Video Consultations**: Encrypted HD video calls powered by Vonage.
- **AI Fallback Chatbot**: Get instant care via RAG-based AI assistant when doctors are offline.
- **Medical Pipeline Integration**: Real-time medical data from FDA, NHS, NIH with 100% data utilization.
- **Educational Videos**: Watch NHS-provided medical videos directly in the chat interface.
- **Medical NER**: Advanced entity recognition for drugs, symptoms, and conditions with API verification.
- **7-Component Confidence Scoring**: Multi-dimensional quality assessment of medical information.
- **Medical Records**: Upload, OCR-extract, and securely store medical reports with AES-256 encryption.
- **Credit System**: Smart wallet with credit-based payment system using Stripe.
- **Smart Health Insights**: Personalized advice powered by AI using NLP and voice input.

### 🩺 For Doctors

- **Profile & Verification**: Multi-step user verification by admin.
- **Appointment Dashboard**: Real-time view and control of patient bookings.
- **Video Tools**: Built-in transcription, chat, and screen sharing for video consultations.
- **AI Medical Assistance**: Get quick access to patient insights and history summaries powered by real-time medical data pipeline.
- **Medical Knowledge Base**: Access comprehensive drug information, condition data, and treatment guidelines during consultations.
- **Earnings & Payouts**: Automated earnings tracking with Stripe & PayPal integration.

### 🛡️ Admin Portal

- **User & Doctor Management**: Activity logs and user control panel.
- **Credential Reviews**: Validate uploaded medical certifications.
- **Payout Management**: Process and review doctor payouts securely.
- **Analytics & Monitoring**: Track platform engagement and financial metrics.
- **Compliance & Security**: Full AES-256 encryption, secure logs, and audit trails.

---

## 🛠️ Tech Stack

### Frontend

- **React 19 + Next.js 15** – App router & server components
- **Tailwind CSS 4** – UI components and layout
- **Shadcn UI** – Accessible, reusable design system
- **Framer Motion** – Modern animations
- **React Hook Form + Zod** – Form controls & type-safe validation

### Backend

- **Next.js API Routes** – Serverless APIs
- **FastAPI (Python)** – Medical data pipeline backend with async processing
- **Prisma ORM** – Schema migrations and type-safe DB queries
- **NeonDB (PostgreSQL)** – Serverless cloud database with autoscaling
- **Clerk** – Authentication with multi-role support (patient, doctor, admin)
- **Gemini AI (via RAG)** – Informed AI reasoning with Pinecone vector retrieval
- **Medical Pipeline** – Comprehensive medical data integration from 5+ authoritative sources

### Integrations

- **Vonage Video API** – Embedded HD video calls and conferencing tools
- **Stripe + PayPal** – Payments and payouts
- **AES-256 Encryption** – Securing medical data and reports
- **Socket.io** – Real-time updates and notifications

### Medical Data Sources

- **OpenFDA** – U.S. FDA drug labels, safety alerts, and adverse events
- **RxNorm** – Drug normalization and standardization (National Library of Medicine)
- **NHS Conditions** – UK National Health Service comprehensive condition data and educational videos
- **MedlinePlus** – NIH/NLM health topics and resources
- **Human Phenotype Ontology (HPO)** – Symptom-to-phenotype mapping and clinical definitions

### Deployment

- **Vercel** - Full-stack app hosting
- **Hugging Face** - Embedding model hosting
- **Render** - Backend scraper hosting

---

## 🧠 AI & Medical Pipeline Features

### Medical Data Pipeline

The MedSync AI platform integrates a comprehensive medical data pipeline that enriches AI chat responses with real-time, validated medical information from trusted sources.

#### 🔍 Medical Named Entity Recognition (NER)

- **Automatic Entity Extraction**: Identifies drugs, symptoms, conditions, and anatomical terms in user messages
- **API-Based Verification**:
  - Drugs verified with RxNorm (RXCUI mapping)
  - Symptoms verified with Human Phenotype Ontology (HPO)
- **High Accuracy**: 0.90-0.95 confidence scores for verified entities
- **Metadata Enrichment**: Includes normalized forms, HPO IDs, definitions, and medical codes

**Example**:
```
User: "I've been taking ibuprofen for my headache"
Extracted Entities:
  - Drug: "ibuprofen" (RXCUI: 5640, confidence: 0.95)
  - Symptom: "headache" (HPO: HP:0002315, confidence: 0.90)
```

#### 📊 7-Component Confidence Scoring System

Every piece of medical information is evaluated across 7 dimensions:

1. **Source Quality** - Authority and reliability of data source
2. **Completeness** - Availability of comprehensive information
3. **Cross-Validation** - Consistency across multiple sources
4. **Query Relevance** - How well data matches the user's question
5. **Evidence Strength** - Number and quality of supporting sources
6. **Freshness** - Recency of data updates
7. **Specificity** - Detail level and precision

**Confidence Levels**:
- Very High (0.80-1.00): Comprehensive, reliable data
- High (0.65-0.79): Good quality with minor gaps
- Moderate (0.50-0.64): Partial information available
- Low (0.30-0.49): Limited or uncertain data
- Very Low (0.00-0.29): Insufficient information

#### 📚 Comprehensive Data Utilization

**Enhanced Data Usage**:
- **OpenFDA**: 16+ fields per drug (vs 4 previously) - 300% increase
- **NHS Conditions**: 20+ fields per condition (vs 4 previously) - 400% increase
- **MedlinePlus**: 7 fields per health topic (vs 2 previously) - 250% increase
- **Overall**: 100% data utilization (vs 20-30% previously) - **3-4x more medical data**

**Data Fields Include**:
- Drug Information: Generic/brand names, class, purpose, dosages, warnings, contraindications, side effects, interactions, pregnancy warnings, storage
- Conditions: Overview, symptoms, causes, risk factors, treatments, self-care, prevention, types, complications, urgent advice, videos, related conditions
- Health Topics: Summaries, snippets, organization info, URLs, related topics

#### 📹 Educational Video Integration

- **NHS Video Library**: Educational videos embedded directly in chat
- **Video Metadata**: Title, description, source, condition name
- **Brightcove Player**: High-quality video playback
- **Persistent Storage**: Videos saved in chat history for later viewing
- **Automatic Display**: Videos appear when discussing relevant medical conditions

#### 🚨 Real-Time Safety Features

- **FDA Adverse Event Monitoring**: Real-time adverse reaction reports
- **Drug Interaction Warnings**: Checks patient medications for conflicts
- **Contraindication Alerts**: Warns about conditions that prevent drug use
- **Emergency Detection**: Identifies urgent symptoms requiring immediate care
- **Triage Recommendations**: Suggests appropriate level of care (emergency, urgent, routine, self-care)

#### 🔄 Multi-Source Cross-Validation

- Validates information across multiple authoritative sources
- Identifies discrepancies and provides nuanced responses
- Ensures accuracy through consensus-based verification
- Tracks data provenance and source attribution

---

## 📦 Installation & Setup

### Prerequisites

**Frontend & Main Application**:
- Node.js 18+ and npm
- NeonDB or PostgreSQL database
- Clerk account (for authentication)
- Vonage Video API account (for calls)
- Stripe & PayPal account (for payments)

**Medical Pipeline Backend** (Optional - Enhances AI chat):
- Python 3.9+
- FastAPI and dependencies (see `Backend/README.md`)

### Local Development

1. **Clone the repository**

```bash
git clone https://github.com/Sadiya-125/MedSync-AI.git
cd MedSync-AI
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment Variables**
   Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="your-database-url"

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-public-clerk-key"
CLERK_SECRET_KEY="your-secret-clerk-key"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/onboarding"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/onboarding"

# Video Calls (Vonage)
NEXT_PUBLIC_VONAGE_APPLICATION_ID="your-vonage-app-id"
VONAGE_PRIVATE_KEY="path-to-your-vonage-private-key"

# App Settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Payments (Stripe)
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"

# AI & ML Integrations
PINECONE_ENV="your-pinecone-environment"
PINECONE_INDEX="your-pinecone-index-name"
PINECONE_API_KEY="your-pinecone-api-key"

HUGGINGFACE_API_KEY="your-huggingface-api-key"
HF_EMBEDDING_MODEL="your-huggingface-embedding-model-name"

GEMINI_API_KEY="your-gemini-api-key"
COHERE_API_KEY="your-cohere-api-key"

# Storage (Supabase)
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# Encryption
ENCRYPTION_KEY="your-generated-encryption-key"

# LLM Assistance
LLM_WHISPERER_URL="your-llm-whisperer-endpoint"
UNSTRACT_API_KEY="your-unstract-api-key"

# Voice AI Integration
NEXT_PUBLIC_VAPI_WEB_TOKEN="your-vapi-web-token"

# Medical Pipeline Backend URL (Optional)
MEDICAL_PIPELINE_URL="http://localhost:8000"
```

4. **Database Setup**

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

5. **Start Development Server**

```bash
npm run dev
```

6. **Initiate the Stripe Server**

```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

7. **Start Medical Pipeline Backend** (Optional - for Enhanced AI features)

```bash
# Navigate to Backend folder
cd ../Backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Medical Pipeline provides**:
- Real-time FDA drug information
- NHS condition data with educational videos
- Medical entity recognition and validation
- Confidence scoring for medical information
- Enhanced AI chat responses with authoritative medical data

---

## 🎯 Key Features Walkthrough

### 1. AI Chat with Medical Pipeline

The AI chat assistant is powered by a comprehensive medical data pipeline:

**How it works**:
1. User asks a medical question
2. Medical NER extracts entities (drugs, symptoms, conditions)
3. Pipeline fetches data from FDA, NHS, MedlinePlus, HPO
4. Confidence scoring evaluates data quality
5. Gemini AI receives enriched medical context
6. User gets accurate response with:
   - Comprehensive medical information
   - Educational videos (when available)
   - Safety warnings
   - Follow-up questions

### 2. Educational Videos in Chat

When discussing medical conditions, relevant educational videos from NHS automatically appear in the chat:

- Videos are displayed in emerald-themed cards
- Include title, description, and source attribution
- Play directly in the chat interface using Brightcove player
- Saved in chat history for future reference
- Help users understand complex medical concepts visually

### 3. Medical Entity Recognition

The system automatically identifies and validates medical terms:

- **Drugs**: Verified with RxNorm, includes RXCUI codes
- **Symptoms**: Mapped to HPO terms with clinical definitions
- **Conditions**: Linked to comprehensive NHS data
- **Anatomy**: Recognized anatomical terms

This ensures accurate understanding and retrieval of relevant medical information.

---

## 📁 Project Structure

```
MedSync AI (Complete Project)/
├── MedSync AI/                      # Frontend & Main Application
│   ├── app/                         # Next.js 15 app directory
│   │   ├── (auth)/                  # Authentication pages
│   │   ├── (root)/                  # Main application pages
│   │   ├── ai-assistant/            # AI chat interface
│   │   ├── appointments/            # Appointment management
│   │   ├── doctors/                 # Doctor discovery & profiles
│   │   ├── admin/                   # Admin dashboard
│   │   └── api/                     # API routes
│   │       ├── chat/                # AI chat endpoints
│   │       ├── appointments/        # Appointment booking
│   │       ├── video/               # Video session management
│   │       └── webhook/             # Payment webhooks
│   ├── components/                  # React components
│   │   ├── ai-chat.jsx              # AI chat with video integration
│   │   ├── emergency-button.jsx     # Emergency call button
│   │   └── ...                      # Other UI components
│   ├── lib/                         # Utility libraries
│   │   ├── medical-pipeline.js      # Medical pipeline integration
│   │   ├── prisma.js                # Database client
│   │   ├── encryption.js            # AES-256 encryption
│   │   └── vonage.js                # Video API integration
│   ├── prisma/                      # Database schema
│   │   └── schema.prisma            # Prisma schema with all models
│   ├── public/                      # Static assets
│   └── README.md                    # This file
│
├── Backend/                         # Medical Data Pipeline (Python)
│   ├── app/
│   │   ├── main.py                  # FastAPI application
│   │   ├── config.py                # Configuration
│   │   ├── models/
│   │   │   └── schemas.py           # Pydantic models
│   │   ├── routers/                 # API endpoints
│   │   │   ├── medical_pipeline.py  # Main pipeline endpoint
│   │   │   ├── drugs.py             # OpenFDA + RxNorm
│   │   │   ├── conditions.py        # NHS conditions
│   │   │   ├── medlineplus.py       # MedlinePlus
│   │   │   └── phenotype.py         # HPO
│   │   └── services/                # Business logic
│   │       ├── medical_ner_service.py      # Medical NER
│   │       ├── confidence_scoring.py        # Confidence scoring
│   │       ├── pipeline_service.py          # Pipeline orchestration
│   │       ├── openfda_service.py           # FDA integration
│   │       ├── rxnorm_service.py            # RxNorm integration
│   │       ├── conditions_service.py        # NHS scraper
│   │       ├── medlineplus_service.py       # MedlinePlus API
│   │       └── phenotype_service.py         # HPO API
│   ├── requirements.txt             # Python dependencies
│   ├── README.md                    # Backend documentation
│   ├── COMPREHENSIVE_DATA_UTILIZATION_UPDATE.md
│   └── COMPREHENSIVE_PIPELINE_INTEGRATION.md
│
└── .env files                       # Environment configurations
```

---

## 🔐 Security Features

### Data Protection
- **AES-256 Encryption**: All medical records and sensitive data
- **Encrypted Messages**: Chat messages encrypted at rest
- **Secure File Storage**: Supabase with encrypted buckets
- **Environment Variables**: All secrets stored securely

### Authentication & Authorization
- **Clerk Authentication**: Multi-role support (Patient, Doctor, Admin)
- **Role-Based Access Control**: Granular permissions
- **Session Management**: Secure JWT tokens
- **Multi-Factor Authentication**: Optional MFA support

### Medical Data Compliance
- **HIPAA Considerations**: Designed with healthcare compliance in mind
- **Data Minimization**: Only necessary data collected
- **Audit Trails**: Comprehensive logging for admin actions
- **No PHI in Pipeline**: Medical Pipeline processes only public medical knowledge

### API Security
- **Rate Limiting**: Protection against abuse
- **CORS Configuration**: Secure cross-origin requests
- **Input Validation**: Zod schemas and Pydantic models
- **Error Handling**: No sensitive data in error messages

---

**Built with ❤️ by Sadiya Maheen Siddiqui**
