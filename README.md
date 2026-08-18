# CrackIt — AI Interview Preparation Platform

CrackIt is a full-stack web application that helps candidates prepare for job interviews. Users upload their resume along with a self-description and a target job description, and the app uses Google's Gemini AI to generate a personalized interview report — including a job-match score, likely technical and behavioral questions (with intent and model answers), identified skill gaps, and a day-wise preparation plan. Users can also generate an ATS-friendly, tailored resume as a downloadable PDF.

**Live demo:** https://crack-it-ai-interview-preparation-p.vercel.app

## ✨ Features

- **User authentication** — Register/login with JWT-based auth stored in HTTP-only cookies, plus token blacklisting on logout.
- **AI-generated interview reports** — Upload a resume PDF, add a self-description and job description, and get back:
  - A match score (0–100) against the job description
  - Technical questions with the interviewer's intent and a model answer
  - Behavioral questions with the interviewer's intent and a model answer
  - A list of skill gaps with severity (low / medium / high)
  - A day-by-day preparation plan
- **Report history** — View all past interview reports for the logged-in user, or fetch a single report by ID.
- **AI-tailored resume export** — Generate a job-tailored, ATS-friendly resume and download it as a PDF (rendered server-side with Puppeteer).

## 🛠 Tech Stack

### Frontend
- [React 19](https://react.dev/) (via [Vite](https://vitejs.dev/))
- [React Router](https://reactrouter.com/) for client-side routing
- [Axios](https://axios-http.com/) for API calls
- [Sass](https://sass-lang.com/) for styling
- [ESLint](https://eslint.org/) for linting

### Backend
- [Node.js](https://nodejs.org/) + [Express 5](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- [Google Gen AI SDK](https://www.npmjs.com/package/@google/genai) (Gemini models) for report/resume generation
- [JWT](https://www.npmjs.com/package/jsonwebtoken) + [bcryptjs](https://www.npmjs.com/package/bcryptjs) for authentication
- [Multer](https://www.npmjs.com/package/multer) for resume (PDF) uploads
- [pdf-parse](https://www.npmjs.com/package/pdf-parse) for reading uploaded resumes
- [Puppeteer](https://pptr.dev/) for generating downloadable resume PDFs
- [Zod](https://zod.dev/) for schema validation of AI responses

### Deployment
- Frontend deployed on [Vercel](https://vercel.com/)

## 📁 Project Structure

```
CrackIt-AI-Interview-Preparation-Platform/
├── backend/
│   ├── server.js                  # App entry point
│   └── src/
│       ├── app.js                 # Express app setup, middleware, routes
│       ├── config/db.js           # MongoDB connection
│       ├── controllers/           # Route handler logic (auth, interview)
│       ├── middlewares/           # Auth middleware, file upload (multer)
│       ├── models/                # Mongoose schemas (User, InterviewReport, Blacklist)
│       ├── routes/                # Express routers (auth, interview)
│       └── services/ai.service.js # Gemini prompts + PDF generation
│
└── frontend/
    ├── index.html
    └── src/
        ├── App.jsx
        ├── app.routes.jsx         # Route definitions
        └── features/
            ├── auth/               # Login, Register, Protected route
            └── interview/          # Home, Interview report pages
```

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- A [MongoDB](https://www.mongodb.com/) instance (local or Atlas)
- A [Google AI Studio](https://aistudio.google.com/) API key (Gemini)

### 1. Clone the repo
```bash
git clone https://github.com/rahulsharmathere/CrackIt-AI-Interview-Preparation-Platform.git
cd CrackIt-AI-Interview-Preparation-Platform
```

### 2. Set up the backend
```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with:
```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_GENAI_API_KEY=your_google_genai_api_key
FRONTEND_URL=http://localhost:5173
```

Run the backend (auto-restarts with nodemon):
```bash
npm run dev
```

### 3. Set up the frontend
```bash
cd ../frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` by default and talks to the backend at `http://localhost:3000`.

## 🔌 API Overview

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new user | Public |
| POST | `/api/auth/login` | Log in with email & password | Public |
| GET | `/api/auth/logout` | Log out (blacklists the token) | Public |
| GET | `/api/auth/get-me` | Get the logged-in user's details | Private |
| POST | `/api/interview` | Generate a new interview report (resume, self-description, job description) | Private |
| GET | `/api/interview` | Get all interview reports for the logged-in user | Private |
| GET | `/api/interview/report/:interviewId` | Get a single interview report by ID | Private |
| POST | `/api/interview/resume/pdf/:interviewReportId` | Generate a tailored resume PDF for a report | Private |

## 🗺 Roadmap Ideas

- Add automated tests (unit/integration)
- Add CI (lint + build on push)
- Rate-limit AI generation endpoints
- Add mock interview practice mode with live Q&A

## 👤 Author

Built by [Rahul Sharma](https://github.com/rahulsharmathere) as a personal/portfolio project.

## 📄 License

No license specified yet — consider adding one (e.g. MIT) if you plan to open this project up for contributions.
