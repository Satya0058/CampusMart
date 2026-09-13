# 🎓 CampusXchange — Private Student Marketplace

**CampusXchange** is a full-stack private student marketplace designed for university campuses. Built with **React** (Vite), **FastAPI**, **SQLite / SQLAlchemy**, and **JWT Authentication**, it provides an ecosystem where verified students from the same college can **Buy**, **Sell**, **Rent**, and **Exchange/Swap** textbooks, calculators, lab equipment, and hostel essentials with zero platform commissions.

---

## ⚡ Key Highlights & Core Features

### 1. The Signature Mode Switch: `[ BUYER | SELLER ]`
- **One Account, Dual Specialized Workspaces**: Students don't need separate buyer and seller accounts.
- **Instant Workspace Morphing**: Clicking the sliding animated mode toggle in the top navigation dynamically reconfigures the entire experience:
  - **Buyer Workspace**: Focused on discovery — search bar, quick action pills (`BUY`, `RENT`, `EXCHANGE`, `REQUEST`), automated Potential Exchange Matches (e.g. *Your Calculator ↕ Priya's Engineering Mathematics Book 94% Match*), personalized recommendations, trending items, and open student requests.
  - **Seller Workspace**: Focused on commerce and inventory — stats overview (*Active Listings, Items Sold, Active Rentals, Exchange Requests*), inventory controls (*Pause, Resume, Mark as Sold, Delete*), reverse student requests with *"I Have This"* response flow, and weekly view analytics charts.
- **State Persistence**: Selected mode is persisted across page reloads in `localStorage`.

### 2. Signature Exchange Center ("Trade What You Have for What You Need")
- Algorithmic compatibility scoring based on academic syllabus categories, text preference overlap, and fair value ratios (ready for plug-and-play AI model integration).
- Side-by-side trade visualization: `[ Your Item ↔ Their Item ]` with calculated match percentages (e.g. 94% Match) and reason rationales.
- Exchange proposal management: `Pending` → `Accepted` → `Rejected` → `Completed`.

### 3. Dedicated Campus Rental Center
- Allows students to rent calculators and lab equipment for exams or short project sprints.
- Interactive date range selector with automatic duration and total INR (`₹`) calculation.
- **Booking Conflict & Overlap Prevention**: Enforces `start_date <= existing.end_date and end_date >= existing.start_date` validation.
- Lifecycle tracking: `REQUESTED` → `APPROVED` → `RESERVED` → `RENTED` → `RETURNED` → `COMPLETED`.

### 4. Reverse Marketplace ("What Do You Need?")
- Students can broadcast requests for books or gear they need with specific deadlines and target budgets.
- Other students can respond with **`[ I HAVE THIS ]`**, offer customized quotes, and coordinate campus handoffs.

### 5. Contextual Item Messaging
- Clean split-view chat interface with attached item headers (e.g., *Re: Casio FX-991ES Plus*).
- Prepared for FastAPI WebSockets integration for real-time chat.

### 6. Trust & Safety Ecosystem
- College-email authentication concept (`student@campus.edu`).
- Verified student badges, star ratings, transaction counts, and peer review logs.
- Safe campus pickup locations (Library foyer, Student canteen, Hostel gate, etc.).

---

## 💻 Tech Stack

- **Frontend**: React 19, Vite, JavaScript, CSS3 Design Tokens, Lucide-React Icons
- **Backend**: FastAPI, Python 3.14, Pydantic v2
- **Database**: SQLite with SQLAlchemy 2.0 ORM
- **Authentication**: JWT (JSON Web Tokens) with PBKDF2 password hashing
- **File Storage**: Local uploads (`backend/uploads/`) statically served by FastAPI

---

## 📁 Project Structure

```
CampusMate/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, routes & auto-seeder
│   │   ├── database.py          # SQLAlchemy SQLite connection & session
│   │   ├── seed_data.py         # Realistic Indian campus seed dataset
│   │   ├── models/              # SQLAlchemy database models
│   │   │   ├── user.py, item.py, exchange.py, rental.py
│   │   │   ├── request.py, message.py, notification.py
│   │   │   └── favorite.py, review.py
│   │   ├── schemas/             # Pydantic validation schemas
│   │   ├── services/            # Business logic
│   │   │   ├── auth_service.py
│   │   │   ├── matching_service.py (AI-ready exchange compatibility)
│   │   │   ├── rental_service.py (Overlap prevention & cost math)
│   │   │   └── notification_service.py
│   │   └── routers/             # Modular REST API endpoints
│   │       ├── auth.py, users.py, items.py, exchanges.py
│   │       ├── rentals.py, requests.py, messages.py
│   │       ├── favorites.py, notifications.py, analytics.py, seed.py
│   └── uploads/                 # Local uploaded item photos
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, Sidebar, ItemCard, Modals
│   │   ├── context/             # MarketplaceMode, Auth, Notifications
│   │   ├── pages/               # BuyerDashboard, SellerDashboard, Marketplace,
│   │   │                        # ExchangeCenter, RentalCenter, Requests,
│   │   │                        # Messages, Profile, Favorites, LandingPage
│   │   ├── services/            # api.js client
│   │   └── styles/              # Premium dark theme design tokens
└── README.md
```

---

## 🚀 Running Locally

### 1. Backend (FastAPI)
```bash
# Navigate to project root
cd CampusMate

# Install Python requirements
python -m pip install -r backend/requirements.txt

# Run backend server (auto-seeds database on first launch)
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be accessible at: `http://127.0.0.1:8000/docs`

### 2. Frontend (React + Vite)
```bash
# In a separate terminal
cd CampusMate/frontend

# Install dependencies
npm install

# Run frontend development server
npm run dev
```
Open `http://127.0.0.1:5173/` in your browser.

---

## 👥 Demo Student Accounts (Included in Navbar Demo Switcher)
Use the **"Demo User"** dropdown in the top navigation bar to test interactions between different students without manually logging in/out:
- **Priya Sharma** (`priya.sharma@campus.edu` / `password123`) — *CSE 3rd Yr, Seller & Active Buyer*
- **Rohan Verma** (`rohan.verma@campus.edu` / `password123`) — *Mech 2nd Yr, Calculator & Drafter owner*
- **Aarav Patel** (`aarav.patel@campus.edu` / `password123`) — *ECE 4th Yr, Arduino kit & Laptop Stand*
- **Ananya Iyer** (`ananya.iyer@campus.edu` / `password123`) — *IT 2nd Yr, DBMS Textbook & Study Lamp*

