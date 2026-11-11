# 🍽️ SharePlate – Share Food, Spread Kindness

SharePlate is a food donation platform that connects food donors with people in need. It helps reduce food waste by allowing donors to share surplus food and recipients to browse and request available donations.

## 📌 Project Overview

Food waste is a major problem, while many people struggle to access sufficient food. SharePlate provides a digital platform to bridge this gap by making food donation and distribution easier, faster, and more accessible.

## ✨ Key Features

- User registration and secure login.
- Separate Donor and Recipient dashboards.
- Add, edit, and manage food donations.
- Browse and search available food donations.
- Request food with quantity selection.
- Approve and reject food requests.
- Track donation and request status.
- Donation and request history.
- Food image uploads.
- Role-based access control.
- Responsive user interface.

## 🛠️ Technologies Used

| Layer | Technology |
|---|---|
| Frontend | React.js, Tailwind CSS |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Authentication | JWT |
| Database Migrations | Alembic |
| API Testing | Pytest |

## 🏗️ Project Structure

```text
SharePlate/
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── context/
│       ├── services/
│       └── utils/
│
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routers/
│   │   ├── services/
│   │   └── main.py
│   ├── alembic/
│   └── tests/
│
├── docs/
└── README.md
```

## ⚙️ Installation and Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd SharePlate
```

### 2. Backend Setup

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:

```bash
# Windows
.venv\Scripts\activate

# Linux/macOS
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a PostgreSQL database named `shareplate`.

Create your environment file:

```bash
copy .env.example .env
```

For Linux/macOS:

```bash
cp .env.example .env
```

Configure the database URL and secret key in the `.env` file.

Run database migrations:

```bash
alembic upgrade head
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

Backend API: `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

Create the environment file:

```bash
copy .env.example .env
```

For Linux/macOS:

```bash
cp .env.example .env
```

Start the frontend:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

## 🔄 How It Works

1. Donors register and log in to the platform.
2. Donors add surplus food details and publish listings.
3. Recipients browse available food donations.
4. Recipients submit requests for the required quantity.
5. Donors review and approve or reject requests.
6. Recipients receive pickup information after approval.
7. Donors mark donations as collected.
8. Both users can track their donation and request history.

## 🧪 Testing

Backend tests can be executed using:

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

## 🚀 Future Enhancements

- Real-time notifications.
- Location-based food donation discovery.
- Google Maps integration.
- Mobile application.
- AI-based food donation recommendations.
- Advanced analytics and reporting.

## 👥 Team Members

This project is developed as a group project by a team of three members.

- Member 1 – Anusha Saladi
- Member 2 – Thanuja Santha
- Member 3 – Surya Ramoju

## ❤️ Our Goal

To reduce food waste and create a community where surplus food reaches people who need it.

**Share Food, Spread Kindness, Reduce Waste!** 🌱
