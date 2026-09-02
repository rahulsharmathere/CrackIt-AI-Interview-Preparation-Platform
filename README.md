# CrackIt — AI Interview Preparation Platform

CrackIt is a full-stack web application that helps candidates prepare for job interviews. Users upload their resume along with a self-description and a target job description, and the app generates a personalized interview report — including a job-match score, technical and behavioral questions grounded in a curated question bank via **Retrieval-Augmented Generation (RAG)**, identified skill gaps, and a day-wise preparation plan. Users can also generate an ATS-friendly, tailored resume as a downloadable PDF.

**Live demo:** https://crack-it-ai-interview-preparation-p.vercel.app

## ✨ Features

- **User authentication** — Register/login with JWT-based auth stored in HTTP-only cookies, token blacklisting on logout, and route protection on the frontend.
- **RAG-powered interview reports** — Instead of letting the LLM invent questions from scratch, the app:
  1. Embeds the job description using Gemini's embedding model
  2. Runs a similarity search against a MongoDB Atlas Vector Search index of ~80 real interview questions (tagged by category/role/difficulty)
  3. Feeds the top-matching questions back into the generation prompt, so the AI's output is grounded in real, relevant questions rather than hallucinated
- **AI-generated interview reports** include:
  - A match score (0–100) against the job description
  - Technical questions with the interviewer's intent and a model answer
  - Behavioral questions with the interviewer's intent and a model answer
  - A list of skill gaps with severity (low / medium / high)
  - A day-by-day preparation plan
- **Report history** — View all past interview reports for the logged-in user, or fetch a single report by ID.
- **AI-tailored resume export** — Generate a job-tailored, ATS-friendly resume and download it as a PDF (rendered server-side with Puppeteer).
- **Persistent app layout** — Shared header/navigation across authenticated pages (Home, Logout, current user) instead of isolated pages.

## 🛠 Tech Stack

### Frontend
- [React 19](https://react.dev/) (via [Vite](https://vitejs.dev/))
- [React Router](https://reactrouter.com/) for client-side routing, with nested layout routes
- [Axios](https://axios-http.com/) for API calls
- [Sass](https://sass-lang.com/) for styling
- [ESLint](https://eslint.org/) for linting

### Backend
- [Node.js](https://nodejs.org/) + [Express 5](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **[MongoDB Atlas Vector Search](https://www.mongodb.com/products/platform/atlas-vector-search)** for the RAG retrieval step
- [Google Gen AI SDK](https://www.npmjs.com/package/@google/genai) (`gemini-3.6-flash` for generation, `gemini-embedding-001` for embeddings)
- [JWT](https://www.npmjs.com/package/jsonwebtoken) + [bcryptjs](https://www.npmjs.com/package/bcryptjs) for authentication
- [Multer](https://www.npmjs.com/package/multer) for resume (PDF) uploads
- [pdf-parse](https://www.npmjs.com/package/pdf-parse) for reading uploaded resumes
- [Puppeteer](https://pptr.dev/) for generating downloadable resume PDFs
- [Zod](https://zod.dev/) for schema validation of AI responses

### Deployment
- Frontend on [Vercel](https://vercel.com/), backend on [Render](https://render.com/), database on [MongoDB Atlas](https://www.mongodb.com/atlas)

## 🧠 How the RAG Pipeline Works

This is the core engineering piece of the project, split into an offline ingestion step and an online retrieval step:

**Ingestion (offline, run once):** `backend/src/scripts/ingestQuestions.js` reads a curated bank of ~80 interview questions (`backend/src/data/questions.json`, spanning DSA, backend, frontend, system design, behavioral, and CS fundamentals), embeds each one with Gemini's `gemini-embedding-001` model, and stores the question text plus its 768-dimension embedding vector in MongoDB via the `Question` model. The script includes retry-with-backoff to handle API rate limits and skips already-ingested questions on re-run.

**Retrieval (online, per request):** When a user submits a job description, `retrieveRelevantQuestions()` in `ai.service.js` embeds that job description with the same model, then runs a `$vectorSearch` aggregation against the Atlas vector index (cosine similarity) to pull the 8 most relevant questions from the bank. These are injected into the prompt sent to Gemini, so the generated report's technical/behavioral questions are grounded in real, curated content rather than being invented purely from the model's training data.

## 📁 Project Structure

```
CrackIt-AI-Interview-Preparation-Platform/
├── backend/
│   ├── server.js                       # App entry point
│   └── src/
│       ├── app.js                      # Express app setup, middleware, routes
│       ├── config/db.js                # MongoDB connection
│       ├── controllers/                # Route handler logic (auth, interview)
│       ├── data/questions.json         # Curated question bank (RAG source data)
│       ├── middlewares/                # Auth middleware, file upload (multer)
│       ├── models/                     # Mongoose schemas (User, InterviewReport, Question, Blacklist)
│       ├── routes/                     # Express routers (auth, interview)
│       ├── scripts/ingestQuestions.js  # One-time embedding + ingestion script for the question bank
│       └── services/ai.service.js      # Gemini prompts, RAG retrieval, PDF generation
│
└── frontend/
    ├── index.html
    └── src/
        ├── App.jsx
        ├── app.routes.jsx              # Route definitions (layout + nested protected routes)
        ├── components/AppLayout.jsx    # Shared header/nav for authenticated pages
        └── features/
            ├── auth/                    # Login, Register, Protected route, auth context/hooks
            └── interview/                # Home, Interview report pages
```

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (required — Vector Search isn't available on local MongoDB)
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
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_GENAI_API_KEY=your_google_genai_api_key
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Seed the question bank (one-time)
```bash
node src/scripts/ingestQuestions.js
```
This embeds and stores all questions from `src/data/questions.json` into MongoDB.

### 4. Create the Atlas Vector Search index
In the Atlas UI, on the `questions` collection, create a Vector Search index named `vector_index`:
```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    }
  ]
}
```

### 5. Run the backend
```bash
npm run dev
```

### 6. Set up the frontend
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
| POST | `/api/auth/logout` | Log out (blacklists the token) | Public |
| GET | `/api/auth/get-me` | Get the logged-in user's details | Private |
| POST | `/api/interview` | Generate a new interview report (resume, self-description, job description) — internally runs RAG retrieval before generation | Private |
| GET | `/api/interview` | Get all interview reports for the logged-in user | Private |
| GET | `/api/interview/report/:interviewId` | Get a single interview report by ID | Private |
| POST | `/api/interview/resume/pdf/:interviewReportId` | Generate a tailored resume PDF for a report | Private |

## 🗺 Roadmap Ideas

- Add automated tests (unit/integration)
- Add CI (lint + build on push)
- Rate-limit AI generation endpoints
- Expand the question bank and support agentic re-retrieval if initial results are weak
- Add mock interview practice mode with live Q&A

## 👤 Author

Built by [Rahul Sharma](https://github.com/rahulsharmathere) as a personal/portfolio project.

## 📄 License

No license specified yet — consider adding one (e.g. MIT) if you plan to open this project up for contributions.