# InterviewAI — AI-Powered Interview Preparation Platform

InterviewAI is a full-stack web application that helps candidates prepare for technical interviews using job-specific questions and AI-powered feedback. Users can analyze a job description, generate a personalized interview, submit answers, and review performance reports.

## Live Demo

- **Frontend:** https://ai-interview-agent-gamma-mauve.vercel.app
- **Backend API:** https://ai-interview-agent-epbo.onrender.com
- **API documentation:** https://ai-interview-agent-epbo.onrender.com/docs
- **GitHub:** https://github.com/Tejraj2004/ai-interview-agent

The application is deployed with Vercel (frontend), Render (backend), and Neon PostgreSQL (database). AI features use the Groq API through LangChain.

## Screenshots

### Dashboard
![InterviewAI dashboard](docs/screenshots/dashboard.png)

### My Interviews
![My Interviews page](docs/screenshots/my-interviews.png)

### Job Description Analysis
![Job Descriptions page](docs/screenshots/job-descriptions.png)

### Interview Reports
![Interview reports](docs/screenshots/reports.png)

### Report overview
![Interview report overview](docs/screenshots/reports-details.png)

## Features

- User registration and login with token-based authentication.
- AI-assisted job description analysis.
- Personalized interview question generation.
- AI-powered answer evaluation and feedback.
- Saved interview sessions that can be resumed.
- Performance reports with overall, technical, and communication scores.
- Strengths, improvement areas, and recommendations.
- Dashboard and analytics summaries.
- PostgreSQL persistence for users, job descriptions, interviews, questions, answers, and reports.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript, Tailwind CSS, React Router |
| Backend | Python, FastAPI, Uvicorn |
| AI | LangChain, Groq API, configured chat model |
| Database | PostgreSQL, SQLAlchemy |
| Authentication | JWT access tokens, password hashing |
| Hosting | Vercel, Render, Neon PostgreSQL |
| Version control | Git, GitHub |

## Architecture

```text
Candidate
   |
   v
React + Vite frontend (Vercel)
   | HTTP/JSON requests + access token
   v
FastAPI backend (Render)
   |                 |
   |                 +--> LangChain --> Groq LLM API
   |
   +--> SQLAlchemy --> Neon PostgreSQL
                         +--> Users
                         +--> Job descriptions
                         +--> Interviews and questions
                         +--> Answers and evaluations
                         +--> Interview reports
```

## Application Workflow

1. Register or log in.
2. Enter a job title, company, and job description.
3. Analyze the job description.
4. Create an interview and generate questions.
5. Submit answers for AI evaluation.
6. Review question-level feedback and scores.
7. View the report, including strengths and recommendations.
8. Return to saved interviews to continue a session.

## Repository Structure

The repository is split into `backend/` and `frontend/`. This tree documents the main application areas based on the current project setup. Verify exact filenames against your checkout before treating every listed path as exhaustive.

```text
ai-interview-agent/
├── .gitignore
├── README.md
├── backend/
│   ├── .env                         # Local secrets; do not commit
│   ├── requirements.txt
│   ├── venv/                        # Local virtual environment; do not commit
│   └── app/
│       ├── main.py                  # FastAPI entry point, CORS, health, routers
│       ├── config.py                # Environment configuration
│       ├── database.py              # SQLAlchemy engine/session
│       ├── models.py                # Database models (if kept in one module)
│       ├── schemas/                 # Pydantic request/response schemas
│       ├── routes/
│       │   ├── auth.py
│       │   ├── job.py
│       │   ├── interview.py
│       │   ├── answer.py
│       │   └── report.py
│       └── ai/
│           ├── llm.py               # Shared LangChain/Groq model
│           ├── job_analyzer.py
│           ├── question_generator.py
│           ├── answer_evaluator.py
│           └── report_generator.py
├── frontend/
│   ├── .env                         # Local Vite variables; do not commit
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   ├── vercel.json                  # SPA route rewrite, if present
│   ├── public/
│   └── src/
│       ├── main.jsx                 # React entry point; filename may vary
│       ├── App.jsx
│       ├── components/              # Shared UI and protected routes
│       ├── pages/                   # Dashboard, jobs, interviews, reports, analytics
│       ├── services/
│       │   └── api.js               # Shared backend API helper
│       └── assets/
└── docs/
    └── screenshots/
        ├── dashboard.png
        ├── my-interviews.png
        ├── job-descriptions.png
        ├── reports.png
        └── reports-details.png
```

**Important:** Keep only paths that actually exist in your checkout. For example, if your models are split into a `models/` package instead of `models.py`, reflect that in the tree. Local `.env` files, virtual environments, `node_modules/`, and build output should not be committed.

## Local Setup

### Prerequisites

- Python version supported by `backend/requirements.txt`
- Node.js and npm
- PostgreSQL locally or a managed PostgreSQL database such as Neon
- Groq API key

### 1. Clone the repository

```powershell
git clone https://github.com/Tejraj2004/ai-interview-agent.git
cd ai-interview-agent
```

### 2. Set up the backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Create `backend/.env` with the variable names required by `app/config.py`. Typical values look like:

```dotenv
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=your_configured_groq_model
SECRET_KEY=replace_with_a_long_random_secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Use the exact variable names and model value expected by your code. Never commit `.env` or share credentials. For local PostgreSQL, use your local connection string.

### 3. Run the backend

From the backend directory:

```powershell
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload
```

Useful URLs:

- API root: http://127.0.0.1:8000/
- Health check: http://127.0.0.1:8000/health
- Database health: http://127.0.0.1:8000/health/database
- Swagger API docs: http://127.0.0.1:8000/docs

### 4. Set up and run the frontend

Open another terminal:

```powershell
cd frontend
npm install
```

Create `frontend/.env`:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start Vite:

```powershell
npm run dev
```

Open http://localhost:5173. The API helper should read `import.meta.env.VITE_API_BASE_URL`. Restart Vite after changing environment variables.

## Important Commands

### Backend (PowerShell)

```powershell
cd D:\ai-interview-agent\backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
python --version
pip list
```

### Frontend (PowerShell)

```powershell
cd D:\ai-interview-agent\frontend
npm install
npm run dev
npm run build
npm run preview
node --version
npm --version
```

### Git (from project root)

```powershell
cd D:\ai-interview-agent
git status
git add README.md docs/screenshots
git commit -m "Add project README and screenshots"
git push origin main
git log --oneline -5
```

## Deployment

### Render backend

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Set backend secrets and database configuration in Render environment variables.
- Configure CORS to allow the production Vercel origin.

### Vercel frontend

- Root directory: `frontend`
- Framework preset: Vite
- Environment variable: `VITE_API_BASE_URL=https://ai-interview-agent-epbo.onrender.com`
- Redeploy after changing build-time environment variables.

### Neon PostgreSQL

Configure the database connection string in Render. Keep credentials private and consider using a migration tool such as Alembic as the schema evolves.

## Troubleshooting

- **`Failed to fetch`:** Verify the backend is live, `VITE_API_BASE_URL` is correct, and FastAPI CORS allows the deployed frontend origin.
- **Old API URL after deployment:** Verify the Vercel environment variable and redeploy the frontend.
- **Refresh on a nested route returns 404:** Check the Vercel SPA rewrite configuration.
- **Database connection failure:** Verify `DATABASE_URL`, SSL requirements, and `/health/database`.
- **AI request failure:** Verify `GROQ_API_KEY` and `GROQ_MODEL` in the backend environment and inspect Render logs.
- **PowerShell blocks virtual environment activation:** If allowed by your machine's policy, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in the same terminal and activate again.

## Security Notes

- Never commit `.env`, API keys, JWT secrets, database passwords, or access tokens.
- Use a long random production `SECRET_KEY` and separate development/production credentials.
- Restrict CORS to trusted origins.
- Use HTTPS in production and enforce authorization on protected resources.
- Rotate any credential that is accidentally exposed.

## License

No license is specified here. Add a `LICENSE` file if you want to define how others may use, modify, and distribute this project.
