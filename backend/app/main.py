from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.auth import get_current_user

from app.core.supabase import supabase

from app.api.jobs import router as jobs_router
from app.api.career import router as career_router
from app.api.resume import router as resume_router


app = FastAPI(
    title="Career AI Job Board API",
    description="AI-powered job discovery and career intelligence platform",
    version="1.0.0"
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://career-ai-job-board-chi.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# JOBS ROUTER
# ============================================================

app.include_router(jobs_router)


# ============================================================
# CAREER INTELLIGENCE ROUTER
# ============================================================

app.include_router(career_router)


# ============================================================
# RESUME ROUTER
# ============================================================

app.include_router(resume_router)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "status": "online",
        "message": "Career AI Job Board API is running"
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# ============================================================
# SUPABASE TEST
# ============================================================

@app.get("/api/test-supabase")
def test_supabase():
    try:
        response = (
            supabase
            .table("jobs")
            .select("job_id")
            .limit(1)
            .execute()
        )

        return {
            "status": "connected",
            "data": response.data
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
# ============================================================
# AUTH TEST
# ============================================================

@app.get("/api/test-auth")
def test_auth(
    user=Depends(get_current_user)
):
    return {
        "status": "authenticated",
        "user_id": user.id,
        "email": user.email
    }
