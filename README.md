# 🏗️ Labour Connect – Smart Labour Hiring Platform

> A full-stack MERN application connecting daily wage workers with clients — featuring AI job recommendations, real-time chat, identity verification, and government scheme discovery.

---

## 📁 Project Structure

```
labour-connect/
├── backend/                  # Node.js + Express + MongoDB API
│   ├── config/               # DB, Cloudinary, Socket.io
│   ├── controllers/          # Business logic
│   ├── middleware/            # Auth, error handling, upload, validation
│   ├── models/               # Mongoose schemas
│   ├── routes/               # Express routers
│   ├── services/             # Recommendation engine
│   ├── utils/                # Email, token helpers, response utils
│   ├── app.js                # Express app setup
│   └── server.js             # Entry point (HTTP + Socket.io)
│
└── frontend/                 # React + Vite + TailwindCSS
    └── src/
        ├── components/
        │   ├── common/       # Reusable UI (JobCard, LabourCard, Avatar…)
        │   ├── layout/       # Navbar, Sidebar, role Layouts
        │   └── chat/         # Chat UI component
        ├── context/          # AuthContext, SocketContext
        ├── hooks/            # useDebounce, useGeolocation…
        ├── pages/
        │   ├── auth/         # Login, Register, ForgotPassword…
        │   ├── labour/       # Dashboard, Profile, Applications, Chat
        │   ├── client/       # Dashboard, PostJob, ManageJobs, Browse, Chat
        │   ├── admin/        # Dashboard, Users, Verifications, Jobs
        │   └── jobs/         # Public job browse & detail
        ├── services/         # Axios API calls (auth, job, user, chat…)
        ├── styles/           # Global CSS + Tailwind layers
        └── utils/            # Formatters, constants, validators
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)
- (Optional) Cloudinary account for file uploads

### Backend
```bash
cd backend
cp .env.example .env      # fill in your secrets
npm install
npm run dev               # http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev               # http://localhost:3000
```

---

## 🔑 Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Strong random secret |
| `CLOUDINARY_*` | Cloudinary credentials |
| `SMTP_*` | Email (Gmail SMTP or similar) |
| `OPENAI_API_KEY` | For AI chatbot (optional) |
| `CLIENT_URL` | Frontend URL (default: http://localhost:3000) |

---

## 📡 API Endpoints

| Module | Base Path |
|---|---|
| Auth | `POST /api/auth/register`, `/login`, `/logout`, `/me` |
| Users | `GET /api/users/labourers`, `PUT /api/users/profile` |
| Jobs | `GET /api/jobs`, `POST /api/jobs`, `POST /api/jobs/:id/apply` |
| Ratings | `POST /api/ratings`, `GET /api/ratings/user/:id` |
| Chat | `GET /api/chat/conversations`, `POST /api/chat/conversations/:id/messages` |
| Admin | `GET /api/admin/dashboard`, `/users`, `/verifications` |
| Schemes | `GET /api/schemes` |
| Recommendations | `GET /api/recommendations/jobs`, `/labourers/:jobId` |

---

## 🛡️ User Roles

| Role | Capabilities |
|---|---|
| **Labour** | Browse/apply to jobs · Profile · Chat · Aadhaar verification · Govt schemes |
| **Client** | Post jobs · Hire workers · Browse labourers · Chat · Rate workers |
| **Admin** | Dashboard analytics · Verify identities · Manage users · Monitor jobs |

---

## 🧩 Tech Stack

**Backend:** Node.js · Express · MongoDB/Mongoose · Socket.io · JWT · Multer · Cloudinary · Nodemailer

**Frontend:** React 18 · Vite · TailwindCSS · React Query · React Router v6 · Socket.io-client · Lucide Icons · React Hot Toast

---

## ✅ Features Implemented

- [x] JWT authentication with httpOnly cookies
- [x] Role-based access control (labour / client / admin)
- [x] Labour profile with skills, wages, portfolio
- [x] Aadhaar document upload + admin review
- [x] Verified badge system
- [x] Job CRUD with geo-search (2dsphere index)
- [x] Job application workflow (apply → accept → reject)
- [x] AI recommendation engine (skill + location + wage scoring)
- [x] Real-time chat with Socket.io (typing indicators, online presence)
- [x] Dual rating system (client→labour, labour→client)
- [x] Government schemes directory
- [x] Admin dashboard with full user & verification management
- [x] Responsive design (mobile-first)
- [x] Cloudinary file upload integration
- [x] Rate limiting, CORS, Helmet security headers
- [x] MongoDB injection protection

---

*Built with ❤️ for India's daily wage workforce.*
