from typing import Optional

from fastapi import APIRouter, Query
from app.core.supabase import supabase

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


@router.get("")
def get_jobs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),

    search: Optional[str] = None,
    location: Optional[str] = None,
    domain: Optional[str] = None,

    min_experience: Optional[int] = Query(None, ge=0),
    max_experience: Optional[int] = Query(None, ge=0),

    employment_type: Optional[str] = None,
):
    """
    Get jobs with pagination and optional filters.
    """

    offset = (page - 1) * limit

    query = (
        supabase
        .table("jobs")
        .select(
            """
            job_id,
            source,
            title,
            company_name,
            location,
            domain,
            roles,
            skills,
            min_experience,
            max_experience,
            employment_type,
            schedule_type,
            min_salary,
            max_salary,
            posted_at,
            apply_url
            """,
            count="exact"
        )
        .eq("is_active", True)
    )

    # -----------------------------
    # SEARCH
    # -----------------------------

    if search:
        search_term = search.strip()

        query = query.or_(
            f"title.ilike.%{search_term}%,"
            f"company_name.ilike.%{search_term}%,"
            f"skills.ilike.%{search_term}%,"
            f"roles.ilike.%{search_term}%"
        )

    # -----------------------------
    # LOCATION
    # -----------------------------

    if location:
        query = query.ilike(
            "location",
            f"%{location.strip()}%"
        )

    # -----------------------------
    # DOMAIN
    # -----------------------------

    if domain:
        query = query.ilike(
            "domain",
            f"%{domain.strip()}%"
        )

    # -----------------------------
    # EXPERIENCE
    # -----------------------------

    if min_experience is not None:
        query = query.gte(
            "max_experience",
            min_experience
        )

    if max_experience is not None:
        query = query.lte(
            "min_experience",
            max_experience
        )

    # -----------------------------
    # EMPLOYMENT TYPE
    # -----------------------------

    if employment_type:
        query = query.ilike(
            "employment_type",
            f"%{employment_type.strip()}%"
        )

    # -----------------------------
    # PAGINATION
    # -----------------------------

    query = (
        query
        .order("posted_at", desc=True)
        .range(offset, offset + limit - 1)
    )

    response = query.execute()

    return {
        "page": page,
        "limit": limit,
        "count": len(response.data),
        "total": response.count,
        "jobs": response.data
    }

@router.get("/{job_id}")
def get_job(job_id: str):
    """
    Get complete details for a single job.
    """

    response = (
        supabase
        .table("jobs")
        .select("*")
        .eq("job_id", job_id)
        .limit(1)
        .execute()
    )

    if not response.data:
        return {
            "status": "not_found",
            "message": "Job not found"
        }

    return {
        "status": "success",
        "job": response.data[0]
    }