from typing import Optional

from fastapi import APIRouter, Query
from app.core.supabase import supabase


router = APIRouter(
    prefix="/api/jobs",
    tags=["Jobs"],
)


# ============================================================
# SOURCE NORMALIZATION
# ============================================================
#
# The database contains source variants such as:
#   LinkedIn
#   via LinkedIn
#   Indeed
#   via Indeed
#   Internshala
#   via Internshala
#   Naukri Dekhe
#   Naukri Safar
#   via Naukri Safar
#
# The UI exposes these as one logical source.
# We keep the original database values unchanged.
# ============================================================

SOURCE_GROUPS = {
    "LinkedIn": [
        "LinkedIn",
        "via LinkedIn",
    ],
    "Indeed": [
        "Indeed",
        "via Indeed",
    ],
    "Internshala": [
        "Internshala",
        "via Internshala",
    ],
    "Naukri": [
        "Naukri Dekhe",
        "Naukri Safar",
        "via Naukri Safar",
    ],
}


def get_source_values(source: Optional[str]) -> Optional[list[str]]:
    """
    Convert a user-facing source into the corresponding
    raw database source values.

    Example:
        LinkedIn -> ["LinkedIn", "via LinkedIn"]
        Naukri  -> ["Naukri Dekhe", "Naukri Safar",
                    "via Naukri Safar"]
    """

    if not source:
        return None

    source_clean = source.strip()

    # Known grouped sources
    if source_clean in SOURCE_GROUPS:
        return SOURCE_GROUPS[source_clean]

    # For sources that don't need grouping,
    # preserve the selected source as-is.
    return [source_clean]


# ============================================================
# GET JOBS
# ============================================================

@router.get("")
def get_jobs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),

    search: Optional[str] = None,
    location: Optional[str] = None,
    domain: Optional[str] = None,

    # User-facing normalized source
    source: Optional[str] = None,

    min_experience: Optional[int] = Query(
        None,
        ge=0,
    ),

    max_experience: Optional[int] = Query(
        None,
        ge=0,
    ),

    employment_type: Optional[str] = None,
):
    """
    Get jobs with pagination and optional filters.

    Supported filters:
    - Search
    - Location
    - Domain
    - Source
    - Minimum experience
    - Maximum experience
    - Employment type

    Source filtering supports normalized groups such as:

        LinkedIn
        -> LinkedIn + via LinkedIn

        Indeed
        -> Indeed + via Indeed

        Internshala
        -> Internshala + via Internshala

        Naukri
        -> Naukri Dekhe + Naukri Safar + via Naukri Safar
    """

    offset = (page - 1) * limit

    # --------------------------------------------------------
    # BASE QUERY
    # --------------------------------------------------------

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
            count="exact",
        )
        .eq("is_active", True)
    )

    # --------------------------------------------------------
    # SEARCH
    # --------------------------------------------------------

    if search:
        search_term = search.strip()

        if search_term:
            query = query.or_(
                f"title.ilike.%{search_term}%,"
                f"company_name.ilike.%{search_term}%,"
                f"skills.ilike.%{search_term}%,"
                f"roles.ilike.%{search_term}%"
            )

    # --------------------------------------------------------
    # LOCATION
    # --------------------------------------------------------

    if location:
        location_term = location.strip()

        if location_term:
            query = query.ilike(
                "location",
                f"%{location_term}%",
            )

    # --------------------------------------------------------
    # DOMAIN
    # --------------------------------------------------------

    if domain:
        domain_term = domain.strip()

        if domain_term:
            query = query.ilike(
                "domain",
                f"%{domain_term}%",
            )

    # --------------------------------------------------------
    # SOURCE
    # --------------------------------------------------------

    source_values = get_source_values(source)

    if source_values:
        query = query.in_(
            "source",
            source_values,
        )

    # --------------------------------------------------------
    # EXPERIENCE
    # --------------------------------------------------------

    if min_experience is not None:
        query = query.gte(
            "max_experience",
            min_experience,
        )

    if max_experience is not None:
        query = query.lte(
            "min_experience",
            max_experience,
        )

    # --------------------------------------------------------
    # EMPLOYMENT TYPE
    # --------------------------------------------------------

    if employment_type:
        employment_term = employment_type.strip()

        if employment_term:
            query = query.ilike(
                "employment_type",
                f"%{employment_term}%",
            )

    # --------------------------------------------------------
    # PAGINATION + SORTING
    # --------------------------------------------------------

    query = (
        query
        .order(
            "posted_at",
            desc=True,
        )
        .range(
            offset,
            offset + limit - 1,
        )
    )

    response = query.execute()

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "page": page,
        "limit": limit,
        "count": len(response.data),
        "total": response.count,
        "jobs": response.data,
    }


# ============================================================
# GET SINGLE JOB
# ============================================================

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
            "message": "Job not found",
        }

    return {
        "status": "success",
        "job": response.data[0],
    }