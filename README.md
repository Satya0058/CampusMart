# 🎓 CampusMart — Private Student Marketplace with AI Safety Intelligence

**CampusMart** is a modern, full-stack peer-to-peer campus marketplace designed exclusively for university students. Built with **React 19 (Vite)**, **FastAPI**, **SQLite / SQLAlchemy**, and **Google Gemini Vision AI**, it provides a secure campus ecosystem where students can **Buy**, **Sell**, **Rent**, and **Exchange/Swap** academic textbooks, scientific calculators, stationery, engineering drafters, electronics, bicycles, and hostel gear with zero platform fees.

---

## ⚡ Core Features & Highlights

### 1. 🛡️ CampusMart AI Safety Intelligence (Google Gemini Vision)
- **Automatic Multimodal Item Verification**: Uploading an item photo runs an instant AI safety scan using the official `google-genai` SDK.
- **Multi-Stage Decision Pipeline**:
  1. **Image Validation**: Checks file size (< 10MB), formats (JPEG, PNG, WebP), and payload integrity.
  2. **Image Quality Analyzer**: Analytical Laplacian variance blur detection, luminance/exposure bounds, and resolution checks. Blurry or pitch-dark photos are routed to `REVIEW`.
  3. **Visual Object Recognition**: Identifies student items (bicycles, drafter scales, pen sets, textbooks, laptops, clothing) with confidence scoring.
  4. **Domain Classification**: Explicitly flags `IN_DOMAIN` (student goods), `OUT_OF_DOMAIN` (digital graphics, logos, selfies, landscapes, cars), and `UNKNOWN` (ambiguous objects).
  5. **Campus Policy Engine**: Zero-tolerance blocking for prohibited weapons/narcotics (`BLOCK`) and unsupported perishable food/beverages (`BLOCK`).
  6. **Image/Text Consistency Verification**: Cross-checks listing title, description, and category against detected visual contents.
  7. **Multi-Model Failover**: Automatically fails over across Google's high-capacity Flash models (`gemini-flash-latest`, `gemini-3.5-flash`, `gemini-3.1-flash-lite`, `gemini-3.7-flash`) to prevent rate limits (`429`) and downtime.

### 2. 🔄 Signature Dual Workspace Mode Switch: `[ BUYER | SELLER ]`
- **One Account, Two Tailored Experiences**: Switch instantly between Buyer and Seller modes from the top navigation bar without logging in and out.
- **Buyer Workspace**: Visual discovery, filter pills (`BUY`, `RENT`, `EXCHANGE`, `DEMANDS`), trending listings, and potential exchange matches.
- **Seller Workspace**: Inventory dashboard (*Active Listings, Sold Items, Active Rentals, Exchange Proposals*), listing management (*Pause, Resume, Mark Sold, Delete*), reverse student requests with *"I Have This"* response flow, and analytics.
- **Persistence**: Selected mode is saved automatically in `localStorage`.

### 3. 🔁 Signature Exchange Center ("Swap What You Have for What You Need")
- Algorithmic compatibility scoring based on academic categories, item condition, and preference overlap.
- Side-by-side trade visualization: `[ Your Item ↔ Their Item ]` with calculated match percentages (e.g. *94% Match*).
- Proposal lifecycle: `Pending` → `Accepted` → `Rejected` → `Completed`.

### 4. ⏱️ Campus Rental Center
- Rent academic gear (scientific calculators, drafters, lab equipment) for exams or short project sprints.
- Interactive date range selector with automatic duration and total INR (`₹`) calculation.
- **Booking Conflict & Overlap Prevention**: Backend enforces strict date availability constraints (`start_date <= existing.end_date and end_date >= existing.start_date`).
- Rental lifecycle: `REQUESTED` → `APPROVED` → `RESERVED` → `RENTED` → `RETURNED` → `COMPLETED`.

### 5. 📢 Reverse Marketplace / Peer Demands ("What Do You Need?")
- Students can broadcast requests for books or gear they urgently need with budget limits and deadlines.
- Other students can browse open demands, click **`[ I HAVE THIS ]`**, offer customized quotes, and coordinate campus handoffs.

### 6. 💬 Contextual In-App Messaging
- Clean split-view conversation interface linked directly to listing headers (e.g. *Re: Casio FX-991ES Plus*).
- Organized inbox with unread message badges and active buyer/seller contexts.

---

## 💻 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, JavaScript (ES6+), CSS3 Design Tokens, Lucide-React Icons |
| **Backend** | FastAPI, Python 3.10+, Pydantic v2, Uvicorn |
| **AI / Computer Vision** | Google Gemini Vision (`google-genai` SDK), Pillow (PIL), NumPy |
| **Database & ORM** | SQLite, SQLAlchemy 2.0 |
| **Authentication** | JWT (JSON Web Tokens), PBKDF2 Password Hashing |
| **Storage** | Local static uploads (`backend/uploads/`) |

---

## 📁 Project Directory Structure

```
CampusMate/
├── .venv/                       # Python Virtual Environment (isolated)
├── .env                         # Project-level environment variables (API keys)
├── backend/
│   ├── .env                     # Backend environment configuration
│   ├── .env.example             # Example configuration template
│   ├── requirements.txt         # Backend Python dependencies
│   ├── campusmate.db            # SQLite database file
│   ├── uploads/                 # Local uploaded item images
│   ├── tests/                   # AI Safety & Backend unit test suite
│   │   ├── test_ai_safety.py    # 26 automated unit tests for AI safety
│   │   └── test_images/         # Test fixtures (sharp, blurry, dark images)
│   └── app/
│       ├── main.py              # FastAPI application entrypoint & middleware
│       ├── database.py          # SQLAlchemy SQLite connection & migrations
│       ├── seed_data.py         # Realistic Indian campus seed dataset
│       ├── models/              # SQLAlchemy database models
│       │   ├── user.py, item.py, exchange.py, rental.py
│       │   ├── request.py, message.py, notification.py
│       │   └── favorite.py, review.py
│       ├── schemas/             # Pydantic validation schemas
│       ├── services/            # Business & AI service logic
│       │   ├── auth_service.py
│       │   ├── matching_service.py
│       │   ├── rental_service.py
│       │   └── ai/              # CampusMart AI Safety Module
│       │       ├── image_quality.py      # Laplacian blur & exposure analyzer
│       │       ├── policy_engine.py      # Decoupled campus safety rules
│       │       ├── consistency_checker.py# Image/text consistency logic
│       │       ├── object_detector.py    # Vision provider facade
│       │       ├── safety_service.py     # 6-stage AI safety orchestrator
│       │       └── providers/
│       │           ├── base.py           # BaseVisionProvider interface
│       │           └── gemini_provider.py# Google GenAI multimodal provider
│       └── routers/             # API endpoint routers
│           ├── auth.py, items.py, exchanges.py, rentals.py
│           ├── requests.py, messages.py, notifications.py, ...
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, Sidebar, ItemCard, Modals
│   │   │   └── modals/AddItemModal.jsx # Add item modal with AI scanning
│   │   ├── context/             # MarketplaceMode, Auth, Notifications
│   │   ├── pages/               # BuyerDashboard, SellerDashboard, Marketplace,
│   │   │                        # ExchangeCenter, RentalCenter, Requests, Messages...
│   │   ├── services/api.js      # Centralized frontend API client
│   │   └── styles/              # Design tokens and responsive styles
│   └── package.json
└── README.md
```

---

## 🚀 Step-by-Step Setup & Running Guide

### Prerequisites
- **Python 3.10 or higher** ([python.org](https://www.python.org/downloads/))
- **Node.js 18 or higher** ([nodejs.org](https://nodejs.org/))
- **Google Gemini API Key** (Free from [Google AI Studio](https://aistudio.google.com/app/apikey))

---

### Step 1: Clone or Open the Repository
```bash
cd e:/CampusMate
```

---

### Step 2: Create and Activate the Virtual Environment (`.venv`)

Creating a virtual environment ensures dependencies are kept isolated without modifying global Python files.

#### On Windows (PowerShell):
```powershell
# Create virtual environment
python -m venv .venv

# Activate virtual environment
.venv\Scripts\Activate.ps1
```

> **Note for PowerShell execution policy**: If script execution is restricted on your machine, run:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

#### On Windows (Command Prompt `cmd`):
```cmd
python -m venv .venv
.venv\Scripts\activate.bat
```

#### On macOS / Linux:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

*(Once activated, your terminal prompt will display `(.venv)`).*

---

### Step 3: Install Backend Requirements
With the virtual environment activated, install all backend dependencies:

```bash
python -m pip install --upgrade pip
pip install -r backend/requirements.txt
```

Installed packages include:
- `fastapi` & `uvicorn` (REST API & ASGI server)
- `sqlalchemy` (Database ORM)
- `pydantic` & `email-validator` (Schema validation)
- `google-genai` (Official Google Gemini Vision SDK)
- `pillow` (Image processing)
- `numpy` (Analytical Laplacian variance blur detection)
- `pyjwt` & `python-multipart` (Authentication & file uploads)

---

### Step 4: Configure the Google Gemini API Key
Create a `.env` file in the `backend/` folder (or edit `backend/.env`):

```env
# backend/.env
GEMINI_API_KEY=AIzaSy...your_actual_gemini_api_key_here

# Optional: Preferred model (defaults to auto-fallback across high-capacity models)
# GEMINI_MODEL=gemini-flash-latest
```

> [!TIP]
> You can get a free API key in under a minute at [Google AI Studio](https://aistudio.google.com/app/apikey).
> Even without an API key, the application functions safely with local image quality checks and routes unverified uploads to manual review.

---

### Step 5: Run Automated Tests (Optional but Recommended)
Run the 26 automated AI safety and backend unit tests to verify your setup:

```bash
# Windows:
.venv\Scripts\python -m unittest discover -s backend/tests -p "test_*.py"

# macOS/Linux:
python -m unittest discover -s backend/tests -p "test_*.py"
```

Expected output:
```
Ran 26 tests in ~2.5s
OK
```

---

### Step 6: Start the Backend Server (FastAPI)
Run Uvicorn inside your virtual environment:

#### Windows:
```powershell
.venv\Scripts\python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```


- **Backend API**: `http://127.0.0.1:8000`
- **Health Check**: `http://127.0.0.1:8000/api/health`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`

---

### Step 7: Install and Start Frontend (React + Vite)
In a **second terminal window**, navigate to `frontend/`:

```bash
cd e:/CampusMate/frontend

# Install Node.js dependencies
npm install

# Start Vite development server
npm run dev
```

- **Frontend App**: `http://localhost:5173`

---

## 👥 Demo Accounts & Testing

You can sign in using your registered account:

| Role | Email | Password |
|---|---|---|
| **Admin User** | `admin@gmail.com` | `admin21` |

---

## 🛡️ Testing the AI Safety Intelligence

1. Log in and toggle the top bar switch to **Seller Mode**.
2. Click the **"Add Item"** button in the top right or bottom of the sidebar.
3. Upload an image to observe the 5-step scanning animation:
   - **Allowed Student Items** (e.g. Bicycles, Scientific Calculators, Drafter Scales, Pen Sets, Textbooks, Hoodies):
     - Verdict: `APPROVE` badge in electric blue.
     - Auto-suggests item title and category.
     - Enables publishing.
   - **Unsupported / Prohibited Items** (e.g. Weapons, Fast Food, Perishable Beverages):
     - Verdict: `✕ LISTING BLOCKED` alert.
     - Explains the violation and disables publication.
   - **Digital Graphics / Logos / Blurry Images**:
     - Verdict: `⚠️ NEEDS REVIEW` alert.
     - Details the reason and requests a clear photo or additional listing details.

---

## 📄 License
CampusMart is built as an open academic project for university student peer-to-peer exchanges.
