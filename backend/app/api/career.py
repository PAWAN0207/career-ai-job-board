from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Optional
import json
import re

from app.core.supabase import supabase
from app.services.gemini import generate_response


router = APIRouter(
    prefix="/api/career",
    tags=["Career Intelligence"]
)


# ============================================================
# CAREER PROFILE MODEL
# ============================================================

class CareerProfile(BaseModel):

    target_role: str = ""

    experience_years: float = Field(
        default=0,
        ge=0
    )

    skills: List[str] = Field(
        default_factory=list
    )

    location: Optional[str] = None

    work_mode: Optional[str] = None


# ============================================================
# TEMPORARY PROFILE
# ============================================================

current_profile = CareerProfile(
    target_role="",
    experience_years=0,
    skills=[],
    location=None,
    work_mode=None
)


# ============================================================
# COMMON HELPERS
# ============================================================

def clean_gemini_json(response: str):

    if not response:
        raise ValueError(
            "Empty response received from Gemini."
        )

    cleaned = response.strip()

    # Remove markdown fences
    cleaned = re.sub(
        r"^```(?:json)?\s*",
        "",
        cleaned,
        flags=re.IGNORECASE
    )

    cleaned = re.sub(
        r"\s*```$",
        "",
        cleaned
    )

    # Extract JSON object if Gemini adds extra text
    start = cleaned.find("{")
    end = cleaned.rfind("}")

    if start != -1 and end != -1:

        cleaned = cleaned[
            start:end + 1
        ]

    return json.loads(cleaned)


def normalize_text(value):

    if value is None:
        return ""

    if isinstance(value, (list, tuple, set)):
        value = " ".join(
            str(item) for item in value
            if item is not None
        )

    elif isinstance(value, dict):
        value = " ".join(
            f"{key} {item}"
            for key, item in value.items()
            if item is not None
        )

    return (
        str(value)
        .strip()
        .lower()
    )


def normalize_skill_name(skill):

    text = normalize_text(skill)

    text = (
        text
        .replace("-", " ")
        .replace("_", " ")
        .replace("/", " ")
    )

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.strip()


def normalize_skills(skills):

    normalized = set()

    for skill in skills or []:

        skill_clean = normalize_skill_name(
            skill
        )

        if skill_clean:
            normalized.add(
                skill_clean
            )

    return normalized


def get_experience_level():

    years = current_profile.experience_years

    if years <= 1:
        return "Entry Level"

    if years <= 3:
        return "Early Career"

    return "Experienced"


def unique_preserve_order(items):

    result = []
    seen = set()

    for item in items or []:

        if item is None:
            continue

        value = str(item).strip()

        if not value:
            continue

        key = value.lower()

        if key not in seen:

            seen.add(key)
            result.append(value)

    return result


# ============================================================
# ROLE FAMILIES
# ============================================================

ROLE_FAMILIES = {

    "data_science": {
        "aliases": [
            "data scientist",
            "junior data scientist",
            "associate data scientist",
            "data science",
            "data science intern"
        ],

        "keywords": [
            "data scientist",
            "data science",
            "junior data scientist",
            "associate data scientist"
        ],

        "skills": [
            "python",
            "machine learning",
            "statistics",
            "sql",
            "pandas",
            "scikit-learn",
            "xgboost",
            "deep learning",
            "tensorflow",
            "pytorch"
        ]
    },

    "data_analytics": {
        "aliases": [
            "data analyst",
            "junior data analyst",
            "associate data analyst",
            "business analyst",
            "business intelligence analyst",
            "bi analyst",
            "analytics analyst",
            "data analytics",
            "business intelligence"
        ],

        "keywords": [
            "data analyst",
            "business analyst",
            "business intelligence",
            "bi analyst",
            "data analytics",
            "analytics analyst"
        ],

        "skills": [
            "sql",
            "excel",
            "power bi",
            "tableau",
            "python",
            "pandas",
            "data analysis",
            "statistics",
            "data visualization"
        ]
    },

    "machine_learning": {
        "aliases": [
            "machine learning engineer",
            "ml engineer",
            "machine learning",
            "ml engineer intern",
            "machine learning intern"
        ],

        "keywords": [
            "machine learning engineer",
            "ml engineer",
            "machine learning"
        ],

        "skills": [
            "python",
            "machine learning",
            "scikit-learn",
            "tensorflow",
            "pytorch",
            "xgboost",
            "docker",
            "mlflow",
            "fastapi"
        ]
    },

    "data_engineering": {
        "aliases": [
            "data engineer",
            "junior data engineer",
            "data engineering",
            "etl developer",
            "etl engineer"
        ],

        "keywords": [
            "data engineer",
            "data engineering",
            "etl"
        ],

        "skills": [
            "python",
            "sql",
            "spark",
            "hadoop",
            "airflow",
            "kafka",
            "postgresql",
            "aws",
            "azure",
            "gcp"
        ]
    },

    "web_development": {
        "aliases": [
            "web developer",
            "frontend developer",
            "front end developer",
            "backend developer",
            "back end developer",
            "full stack developer",
            "full-stack developer",
            "software developer",
            "software engineer",
            "react developer",
            "javascript developer"
        ],

        "keywords": [
            "web developer",
            "frontend developer",
            "front end developer",
            "backend developer",
            "back end developer",
            "full stack developer",
            "full-stack developer",
            "software developer",
            "software engineer",
            "react developer",
            "javascript developer"
        ],

        "skills": [
            "javascript",
            "typescript",
            "react",
            "next.js",
            "nextjs",
            "html",
            "css",
            "node.js",
            "nodejs",
            "express",
            "java",
            "c++",
            "git"
        ]
    },

    "operations": {
        "aliases": [
            "operations executive",
            "operation executive",
            "operations analyst",
            "banking operations executive",
            "banking operations",
            "operations associate",
            "process associate",
            "process executive",
            "back office executive",
            "operations"
        ],

        "keywords": [
            "operations executive",
            "operation executive",
            "operations analyst",
            "banking operations",
            "operations associate",
            "process associate",
            "process executive",
            "back office executive",
            "operations"
        ],

        "skills": [
            "kyc",
            "banking operations",
            "disbursement",
            "finone",
            "sfdc",
            "tally erp",
            "gst",
            "ms office",
            "microsoft office",
            "excel",
            "communication"
        ]
    },

    "finance": {
        "aliases": [
            "finance analyst",
            "financial analyst",
            "credit analyst",
            "risk analyst",
            "banking analyst"
        ],

        "keywords": [
            "finance analyst",
            "financial analyst",
            "credit analyst",
            "risk analyst",
            "banking analyst"
        ],

        "skills": [
            "excel",
            "financial analysis",
            "credit risk",
            "risk analysis",
            "banking",
            "sql"
        ]
    }
}


# ============================================================
# ROLE FAMILY DETECTION
# ============================================================

def get_role_family(target_role):

    role = normalize_text(
        target_role
    )

    if not role:
        return None

    # Exact / alias match first
    for family, config in ROLE_FAMILIES.items():

        for alias in config["aliases"]:

            alias_normalized = normalize_text(
                alias
            )

            if (
                role == alias_normalized
                or alias_normalized in role
                or role in alias_normalized
            ):
                return family

    # Keyword fallback
    for family, config in ROLE_FAMILIES.items():

        for keyword in config["keywords"]:

            if keyword in role:
                return family

    return None


# ============================================================
# JOB ROLE FAMILY DETECTION
# ============================================================

def get_job_role_family(
    title,
    domain,
    roles
):

    title_text = normalize_text(
        title
    )

    domain_text = normalize_text(
        domain
    )

    roles_text = normalize_text(
        roles
    )

    combined = (
        f"{title_text} "
        f"{domain_text} "
        f"{roles_text}"
    )

    # --------------------------------------------------------
    # Strong title-based detection
    # --------------------------------------------------------

    strong_patterns = [

        (
            "data scientist",
            "data_science"
        ),

        (
            "data science",
            "data_science"
        ),

        (
            "machine learning engineer",
            "machine_learning"
        ),

        (
            "ml engineer",
            "machine_learning"
        ),

        (
            "data engineer",
            "data_engineering"
        ),

        (
            "frontend developer",
            "web_development"
        ),

        (
            "front end developer",
            "web_development"
        ),

        (
            "backend developer",
            "web_development"
        ),

        (
            "back end developer",
            "web_development"
        ),

        (
            "full stack developer",
            "web_development"
        ),

        (
            "full-stack developer",
            "web_development"
        ),

        (
            "web developer",
            "web_development"
        ),

        (
            "react developer",
            "web_development"
        ),

        (
            "javascript developer",
            "web_development"
        ),

        (
            "software engineer",
            "web_development"
        ),

        (
            "software developer",
            "web_development"
        ),

        (
            "operations executive",
            "operations"
        ),

        (
            "operation executive",
            "operations"
        ),

        (
            "operations analyst",
            "operations"
        ),

        (
            "banking operations",
            "operations"
        ),

        (
            "process executive",
            "operations"
        ),

        (
            "process associate",
            "operations"
        ),

        (
            "back office",
            "operations"
        ),

        (
            "data analyst",
            "data_analytics"
        ),

        (
            "business analyst",
            "data_analytics"
        ),

        (
            "business intelligence",
            "data_analytics"
        ),

        (
            "bi analyst",
            "data_analytics"
        ),

        (
            "analytics analyst",
            "data_analytics"
        ),

        (
            "credit analyst",
            "finance"
        ),

        (
            "financial analyst",
            "finance"
        ),

        (
            "risk analyst",
            "finance"
        ),

        (
            "banking analyst",
            "finance"
        )
    ]

    # Prefer title because domain can be broad
    for pattern, family in strong_patterns:

        if pattern in title_text:

            return family

    # --------------------------------------------------------
    # Domain / roles detection
    # --------------------------------------------------------

    for family, config in ROLE_FAMILIES.items():

        for keyword in config["keywords"]:

            if keyword in combined:

                return family

    return None


# ============================================================
# ROLE FAMILY COMPATIBILITY
# ============================================================

def role_family_matches(
    target_family,
    job_family
):
    """
    Soft compatibility helper.

    This is intentionally NOT used as a hard filter in the
    recommendation engine. It only gives a positive signal
    when the families are related.
    """

    if not target_family or not job_family:
        return False

    if target_family == job_family:
        return True

    compatible_groups = [
        {
            "data_science",
            "machine_learning"
        },
        {
            "data_analytics",
            "finance"
        },
        {
            "data_engineering",
            "machine_learning"
        }
    ]

    return any(
        target_family in group
        and job_family in group
        for group in compatible_groups
    )


# ============================================================
# GENERIC ROLE / TEXT SIGNALS
# ============================================================

def extract_resume_text_signals(resume_profile):
    """
    Collect role-related text from whatever fields the resume
    parser provides. This keeps the career engine generic:
    it does not depend on one fixed resume schema.
    """

    if not isinstance(resume_profile, dict):
        return ""

    chunks = []

    def collect(value):
        if value is None:
            return

        if isinstance(value, str):
            if value.strip():
                chunks.append(value)

        elif isinstance(value, (list, tuple, set)):
            for item in value:
                collect(item)

        elif isinstance(value, dict):
            for key, item in value.items():
                # Skill names are useful for matching, but we do
                # not want category names such as "data_analysis"
                # to become career-role evidence.
                if str(key).lower() not in {
                    "data_analysis",
                    "machine_learning",
                    "programming",
                    "visualization",
                    "deployment",
                    "other"
                }:
                    collect(item)

    collect(resume_profile)
    return normalize_text(" ".join(chunks))


def role_text_match_score(
    target_role,
    job_title,
    job_domain,
    job_roles
):
    """
    Score direct text similarity between the candidate's role
    and the job. This works even when the role is not present in
    ROLE_FAMILIES (for example Chemist, HR, Sales, Marketing,
    Legal, Design, Teaching, etc.).
    """

    target = normalize_text(target_role)

    if not target:
        return 0

    title = normalize_text(job_title)
    domain = normalize_text(job_domain)
    roles = normalize_text(job_roles)

    job_text = f"{title} {domain} {roles}"

    if target in title:
        return 30

    if target in roles or target in domain:
        return 24

    # Compare meaningful role words without requiring an exact
    # phrase. Generic stop words are ignored.
    stop_words = {
        "and", "the", "for", "with", "of", "to",
        "a", "an", "in", "on", "at", "role",
        "job", "professional", "entry", "level",
        "junior", "senior", "associate"
    }

    target_words = {
        word
        for word in re.findall(r"[a-z0-9+#.]+", target)
        if word not in stop_words and len(word) > 1
    }

    if not target_words:
        return 0

    job_words = set(
        re.findall(
            r"[a-z0-9+#.]+",
            job_text
        )
    )

    overlap = len(
        target_words.intersection(job_words)
    )

    if overlap == 0:
        return 0

    return min(
        20,
        round(
            (overlap / len(target_words)) * 20
        )
    )


# ============================================================
# CAREER HEALTH
# ============================================================

@router.get("/health")
def career_health():

    return {
        "status": "success",
        "message": "Career Intelligence API is working"
    }


# ============================================================
# PROFILE RESPONSE
# ============================================================

def build_profile_response():

    return {
        "target_role":
            current_profile.target_role,

        "experience_years":
            current_profile.experience_years,

        "experience_level":
            get_experience_level(),

        "skills":
            current_profile.skills,

        "location":
            current_profile.location,

        "work_mode":
            current_profile.work_mode
    }


# ============================================================
# CAREER MATCH SCORE
# ============================================================

def calculate_career_match_score():

    target_role = (
        current_profile.target_role
        or ""
    ).strip()

    target_family = get_role_family(
        target_role
    )

    user_skills = normalize_skills(
        current_profile.skills
    )

    experience = (
        current_profile.experience_years
    )

    if not target_family:
        # Never assume an unknown resume is Data Science.
        # Generic profiles are scored from their actual skills.
        role_config = {}
    else:
        role_config = ROLE_FAMILIES.get(
            target_family,
            {}
        )

    expected_skills = {
        normalize_skill_name(skill)
        for skill in role_config.get(
            "skills",
            []
        )
    }

    role_matches = (
        user_skills
        .intersection(
            expected_skills
        )
    )

    # --------------------------------------------------------
    # ROLE SKILL SCORE
    # --------------------------------------------------------

    if expected_skills:

        role_score = (
            len(role_matches)
            / len(expected_skills)
        ) * 35

    else:

        role_score = 0

    # --------------------------------------------------------
    # TECHNICAL SKILLS
    # --------------------------------------------------------

    technical_skills = {

        "python",
        "sql",
        "machine learning",
        "pandas",
        "numpy",
        "scikit learn",
        "power bi",
        "tableau",
        "excel",
        "statistics",
        "git",
        "github",
        "fastapi",
        "streamlit",
        "docker",
        "tensorflow",
        "pytorch",
        "javascript",
        "typescript",
        "react",
        "html",
        "css",
        "java",
        "c++",
        "kyc",
        "banking operations",
        "financial analysis"
    }

    technical_matches = (
        user_skills.intersection(
            technical_skills
        )
    )

    technical_score = min(
        len(technical_matches) * 3,
        25
    )

    # --------------------------------------------------------
    # EXPERIENCE
    # --------------------------------------------------------

    if experience >= 5:

        experience_score = 15

    elif experience >= 3:

        experience_score = 13

    elif experience >= 2:

        experience_score = 11

    elif experience >= 1:

        experience_score = 9

    else:

        experience_score = 6

    # --------------------------------------------------------
    # PRACTICAL READINESS
    # --------------------------------------------------------

    practical_skills = {

        "git",
        "github",
        "fastapi",
        "streamlit",
        "docker",
        "mlflow",
        "aws",
        "azure",
        "gcp",
        "airflow"
    }

    practical_matches = (
        user_skills.intersection(
            practical_skills
        )
    )

    practical_score = min(
        len(practical_matches) * 3,
        15
    )

    # --------------------------------------------------------
    # ENTRY LEVEL BONUS
    # --------------------------------------------------------

    entry_bonus = 0

    if experience <= 1:

        entry_skills = {
            normalize_skill_name(skill)
            for skill in role_config.get(
                "skills",
                []
            )
        }

        entry_matches = (
            user_skills.intersection(
                entry_skills
            )
        )

        entry_bonus = min(
            len(entry_matches) * 2,
            10
        )

    score = (
        role_score
        + technical_score
        + experience_score
        + practical_score
        + entry_bonus
    )

    return round(
        min(score, 100)
    )


# ============================================================
# GET PROFILE
# ============================================================

@router.get("/profile")
def get_career_profile():

    profile = build_profile_response()

    profile["match_score"] = (
        calculate_career_match_score()
    )

    profile["role_family"] = (
        get_role_family(
            current_profile.target_role
        )
    )

    return {
        "status": "success",
        "profile": profile
    }


# ============================================================
# UPDATE PROFILE
# ============================================================

@router.post("/profile")
def update_career_profile(
    profile: CareerProfile
):

    global current_profile

    current_profile = profile

    updated_profile = (
        build_profile_response()
    )

    updated_profile["match_score"] = (
        calculate_career_match_score()
    )

    updated_profile["role_family"] = (
        get_role_family(
            current_profile.target_role
        )
    )

    return {
        "status": "success",

        "message":
            "Career profile updated successfully",

        "profile":
            updated_profile
    }


# ============================================================
# FALLBACK â€” CAREER INSIGHTS
# ============================================================

def generate_fallback_insights():

    skills = normalize_skills(
        current_profile.skills
    )

    target_role = (
        current_profile.target_role
        or "your target role"
    )

    target_family = get_role_family(
        target_role
    )

    insights = []

    # --------------------------------------------------------
    # ROLE-SPECIFIC SKILLS
    # --------------------------------------------------------

    role_config = ROLE_FAMILIES.get(
        target_family,
        {}
    )

    expected_skills = [
        normalize_skill_name(skill)
        for skill in role_config.get(
            "skills",
            []
        )
    ]

    strong_skills = [
        skill
        for skill in expected_skills
        if skill in skills
    ]

    if strong_skills:

        insights.append({

            "type":
                "strength",

            "title":
                "Relevant Skill Foundation",

            "description":
                (
                    "Your profile contains "
                    + ", ".join(
                        strong_skills[:6]
                    )
                    + ", which are relevant "
                    "to "
                    + target_role
                    + " roles."
                )
        })

    # --------------------------------------------------------
    # GAPS
    # --------------------------------------------------------

    recommended_gaps = []

    for skill in expected_skills:

        if skill not in skills:

            recommended_gaps.append(
                skill
            )

    if recommended_gaps:

        insights.append({

            "type":
                "gap",

            "title":
                "Important Skill Gaps",

            "description":
                (
                    "Focus next on "
                    + ", ".join(
                        recommended_gaps[:4]
                    )
                    + " to improve your "
                    "alignment with "
                    + target_role
                    + " roles."
                )
        })

    # --------------------------------------------------------
    # READINESS
    # --------------------------------------------------------

    if current_profile.experience_years == 0:

        readiness = (
            "As an entry-level candidate, "
            "prioritize internships, junior "
            "roles, portfolio projects and "
            "interview preparation."
        )

    else:

        readiness = (
            "Continue strengthening your "
            "portfolio and target roles "
            "aligned with your experience "
            "and technical skills."
        )

    insights.append({

        "type":
            "development",

        "title":
            "Career Readiness",

        "description":
            readiness
    })

    # --------------------------------------------------------
    # RECOMMENDED SKILLS
    # --------------------------------------------------------

    recommended_skills = []

    for skill in expected_skills:

        if skill not in skills:

            recommended_skills.append(
                skill.title()
            )

    # --------------------------------------------------------
    # PROJECTS
    # --------------------------------------------------------

    if target_family == "web_development":

        recommended_projects = [

            "Full-stack web application with authentication",

            "REST API with database integration",

            "Production-style frontend deployment project"
        ]

    elif target_family == "operations":

        recommended_projects = [

            "Operations KPI dashboard",

            "Excel-based process automation project",

            "Banking operations analytics dashboard"
        ]

    elif target_family == "data_analytics":

        recommended_projects = [

            "SQL and Power BI analytics project",

            "Business KPI dashboard",

            "Customer or financial analytics project"
        ]

    elif target_family == "machine_learning":

        recommended_projects = [

            "End-to-end machine learning project",

            "ML API deployment with FastAPI",

            "ML pipeline using Docker and MLflow"
        ]

    else:

        recommended_projects = [

            "Build a portfolio project directly related to your target role",

            "Create a practical project that demonstrates your strongest skills",

            "Deploy or present one project with measurable outcomes"
        ]

    # --------------------------------------------------------
    # ACTION PLAN
    # --------------------------------------------------------

    action_plan = [

        f"Strengthen skills directly relevant to {target_role}.",

        "Build and deploy one production-style portfolio project.",

        "Apply to internships, junior and entry-level roles while preparing for interviews."
    ]

    return {

        "overall_assessment":
            (
                "Your current profile has a "
                "foundation for "
                + target_role
                + " opportunities. "
                "Focus on practical skills, "
                "portfolio quality and "
                "closing the identified "
                "skill gaps."
            ),

        "insights":
            insights,

        "recommended_skills":
            recommended_skills[:5],

        "recommended_projects":
            recommended_projects,

        "action_plan":
            action_plan
    }


# ============================================================
# GEMINI CAREER INSIGHTS
# ============================================================

@router.get("/insights")
def get_career_insights():

    target_role = (
        current_profile.target_role
        or "your target role"
    ).strip()

    experience_years = (
        current_profile.experience_years
    )

    skills = [
        skill.strip()
        for skill in current_profile.skills
        if skill.strip()
    ]

    location = (
        current_profile.location
        or "Not specified"
    )

    work_mode = (
        current_profile.work_mode
        or "Not specified"
    )

    prompt = f"""
You are an expert AI Career Advisor.

Analyze ONLY this candidate profile.

Target Role:
{target_role}

Experience:
{experience_years} years

Skills:
{", ".join(skills)}

Location:
{location}

Preferred Work Mode:
{work_mode}

Provide realistic career guidance.

Do NOT invent experience.
Do NOT assume the candidate has skills not listed.
Do NOT recommend unrelated career domains.

Return ONLY valid JSON:

{{
    "overall_assessment": "short assessment",

    "insights": [
        {{
            "type": "strength",
            "title": "title",
            "description": "description"
        }},
        {{
            "type": "gap",
            "title": "title",
            "description": "description"
        }},
        {{
            "type": "development",
            "title": "title",
            "description": "description"
        }}
    ],

    "recommended_skills": [
        "skill 1",
        "skill 2",
        "skill 3"
    ],

    "recommended_projects": [
        "project 1",
        "project 2"
    ],

    "action_plan": [
        "action 1",
        "action 2",
        "action 3"
    ]
}}
"""

    try:

        ai_response = generate_response(
            prompt
        )

        ai_data = clean_gemini_json(
            ai_response
        )

        insights = ai_data.get(
            "insights",
            []
        )

        return {

            "status":
                "success",

            "source":
                "gemini",

            "target_role":
                target_role,

            "experience_years":
                experience_years,

            "skills_analyzed":
                skills,

            "overall_assessment":
                ai_data.get(
                    "overall_assessment",
                    ""
                ),

            "total_insights":
                len(insights),

            "insights":
                insights,

            "recommended_skills":
                ai_data.get(
                    "recommended_skills",
                    []
                ),

            "recommended_projects":
                ai_data.get(
                    "recommended_projects",
                    []
                ),

            "action_plan":
                ai_data.get(
                    "action_plan",
                    []
                )
        }

    except Exception:

        fallback = (
            generate_fallback_insights()
        )

        return {

            "status":
                "success",

            "source":
                "fallback",

            "target_role":
                target_role,

            "experience_years":
                experience_years,

            "skills_analyzed":
                skills,

            "overall_assessment":
                fallback[
                    "overall_assessment"
                ],

            "total_insights":
                len(
                    fallback["insights"]
                ),

            "insights":
                fallback[
                    "insights"
                ],

            "recommended_skills":
                fallback[
                    "recommended_skills"
                ],

            "recommended_projects":
                fallback[
                    "recommended_projects"
                ],

            "action_plan":
                fallback[
                    "action_plan"
                ],

            "ai_error":
                "Gemini temporarily unavailable"
        }


# ============================================================
# FALLBACK â€” CAREER PATH
# ============================================================

def fallback_career_path():

    target_role = (
        current_profile.target_role
        or "Target Role"
    )

    target_family = get_role_family(
        target_role
    )

    paths = {

        "data_science": [
            {
                "title":
                    "Data Analyst",
                "level":
                    "Start Here"
            },
            {
                "title":
                    "Junior Data Scientist",
                "level":
                    "Next Step"
            },
            {
                "title":
                    "Data Scientist",
                "level":
                    "Growth"
            },
            {
                "title":
                    "Senior Data Scientist",
                "level":
                    "Long Term"
            }
        ],

        "data_analytics": [
            {
                "title":
                    "Junior Data Analyst",
                "level":
                    "Start Here"
            },
            {
                "title":
                    "Data Analyst",
                "level":
                    "Next Step"
            },
            {
                "title":
                    "Senior Data Analyst",
                "level":
                    "Growth"
            },
            {
                "title":
                    "Analytics Manager",
                "level":
                    "Long Term"
            }
        ],

        "machine_learning": [
            {
                "title":
                    "ML Intern / Junior ML Engineer",
                "level":
                    "Start Here"
            },
            {
                "title":
                    "Machine Learning Engineer",
                "level":
                    "Next Step"
            },
            {
                "title":
                    "Senior ML Engineer",
                "level":
                    "Growth"
            },
            {
                "title":
                    "ML Architect / Lead",
                "level":
                    "Long Term"
            }
        ],

        "web_development": [
            {
                "title":
                    "Junior Web Developer",
                "level":
                    "Start Here"
            },
            {
                "title":
                    "Web Developer",
                "level":
                    "Next Step"
            },
            {
                "title":
                    "Senior Developer",
                "level":
                    "Growth"
            },
            {
                "title":
                    "Technical Lead",
                "level":
                    "Long Term"
            }
        ],

        "operations": [
            {
                "title":
                    "Operations Executive",
                "level":
                    "Start Here"
            },
            {
                "title":
                    "Operations Analyst",
                "level":
                    "Next Step"
            },
            {
                "title":
                    "Senior Operations Analyst",
                "level":
                    "Growth"
            },
            {
                "title":
                    "Operations Manager",
                "level":
                    "Long Term"
            }
        ],

        "finance": [
            {
                "title":
                    "Junior Financial / Credit Analyst",
                "level":
                    "Start Here"
            },
            {
                "title":
                    "Financial / Credit Analyst",
                "level":
                    "Next Step"
            },
            {
                "title":
                    "Senior Analyst",
                "level":
                    "Growth"
            },
            {
                "title":
                    "Risk / Finance Manager",
                "level":
                    "Long Term"
            }
        ]
    }

    if target_family in paths:
        return paths[target_family]

    return [
        {
            "title": target_role,
            "level": "Start Here"
        },
        {
            "title": f"Senior {target_role}",
            "level": "Growth"
        },
        {
            "title": f"Lead {target_role}",
            "level": "Long Term"
        }
    ]


# ============================================================
# GEMINI CAREER PATH
# ============================================================

@router.get("/career-path")
def get_career_path():

    target_role = (
        current_profile.target_role
        or "Target Role"
    ).strip()

    skills = [
        skill.strip()
        for skill in current_profile.skills
        if skill.strip()
    ]

    experience = (
        current_profile.experience_years
    )

    prompt = f"""
You are an expert career strategist.

Create a realistic career progression.

Target Role:
{target_role}

Experience:
{experience} years

Skills:
{", ".join(skills)}

Do not recommend unrelated career domains.

Return ONLY valid JSON:

{{
    "career_path": [
        {{
            "title": "role",
            "level": "Start Here"
        }},
        {{
            "title": "role",
            "level": "Next Step"
        }},
        {{
            "title": "role",
            "level": "Growth"
        }},
        {{
            "title": "role",
            "level": "Long Term"
        }}
    ]
}}
"""

    try:

        ai_response = generate_response(
            prompt
        )

        ai_data = clean_gemini_json(
            ai_response
        )

        career_path = ai_data.get(
            "career_path",
            []
        )

        if career_path:

            return {

                "status":
                    "success",

                "source":
                    "gemini",

                "career_path":
                    career_path
            }

    except Exception:

        pass

    return {

        "status":
            "success",

        "source":
            "fallback",

        "career_path":
            fallback_career_path()
    }


# ============================================================
# JOB SKILL EXTRACTION
# ============================================================

KNOWN_SKILLS = {

    "python",
    "sql",
    "machine learning",
    "deep learning",
    "pandas",
    "numpy",
    "scikit-learn",
    "tensorflow",
    "pytorch",
    "xgboost",
    "statistics",
    "power bi",
    "tableau",
    "excel",
    "aws",
    "azure",
    "gcp",
    "docker",
    "kubernetes",
    "fastapi",
    "flask",
    "streamlit",
    "mlflow",
    "airflow",
    "spark",
    "hadoop",
    "postgresql",
    "mysql",
    "mongodb",
    "redis",
    "kafka",
    "langchain",
    "llm",
    "generative ai",
    "nlp",
    "react",
    "javascript",
    "typescript",
    "next.js",
    "nextjs",
    "html",
    "css",
    "node.js",
    "nodejs",
    "java",
    "c++",
    "go",
    "git",
    "github",
    "kyc",
    "banking operations",
    "disbursement",
    "finone",
    "sfdc",
    "tally erp",
    "gst",
    "ms office",
    "microsoft office",
    "data analysis",
    "data visualization",
    "financial analysis",
    "credit risk",
    "risk analysis"
}


def extract_job_skills(
    skills_text: str
):

    text = normalize_skill_name(
        skills_text
    )

    found = set()

    for skill in KNOWN_SKILLS:

        normalized = normalize_skill_name(
            skill
        )

        # Word/phrase-aware matching
        pattern = (
            r"(?<![a-z0-9])"
            + re.escape(normalized)
            + r"(?![a-z0-9])"
        )

        if re.search(
            pattern,
            text
        ):

            found.add(
                normalized
            )

    return found


# ============================================================
# USER SKILL MATCHING
# ============================================================

def find_matching_skills(
    user_skills,
    searchable_text
):
    """
    Alias-aware skill matching.

    Handles common variants such as:
    Excel / MS Excel / Microsoft Excel
    MS Office / Microsoft Office
    PowerPoint / MS PowerPoint / Microsoft PowerPoint
    Tally / Tally ERP
    """

    text = normalize_text(
        searchable_text
    )

    if not text:
        return []

    # --------------------------------------------------------
    # COMMON SKILL ALIASES
    # --------------------------------------------------------

    aliases = {
        "excel": [
            "excel",
            "ms excel",
            "microsoft excel",
        ],

        "microsoft office": [
            "ms office",
            "microsoft office",
            "microsoft office suite",
            "ms office suite",
        ],

        "powerpoint": [
            "powerpoint",
            "ms powerpoint",
            "microsoft powerpoint",
        ],

        "word": [
            "word",
            "ms word",
            "microsoft word",
        ],

        "tally erp": [
            "tally",
            "tally erp",
            "tally erp 9",
            "tallyprime",
            "tally prime",
        ],

        "sql": [
            "sql",
            "mysql",
            "postgresql",
            "postgres",
            "sql server",
        ],

        "python": [
            "python",
        ],

        "power bi": [
            "power bi",
            "powerbi",
        ],

        "tableau": [
            "tableau",
        ],

        "salesforce": [
            "salesforce",
            "sfdc",
        ],

        "sfdc": [
            "sfdc",
            "salesforce",
        ],
    }

    matched = []

    for skill in user_skills:

        original_skill = str(
            skill
        ).strip()

        if not original_skill:
            continue

        normalized_skill = normalize_skill_name(
            original_skill
        )

        if not normalized_skill:
            continue

        candidates = aliases.get(
            normalized_skill,
            [normalized_skill]
        )

        found = False

        for candidate in candidates:

            candidate_normalized = normalize_skill_name(
                candidate
            )

            if not candidate_normalized:
                continue

            pattern = (
                r"(?<![a-z0-9])"
                + re.escape(candidate_normalized)
                + r"(?![a-z0-9])"
            )

            if re.search(
                pattern,
                text
            ):
                found = True
                break

        if found:
            matched.append(
                original_skill
            )

    return unique_preserve_order(
        matched
    )


# ============================================================
# DETERMINISTIC JOB EXPLANATION
# ============================================================

def build_job_explanation(job):

    matched = job.get(
        "matched_skills",
        []
    )

    gaps = job.get(
        "skill_gaps",
        []
    )

    score = job.get(
        "match_score",
        0
    )

    experience_status = job.get(
        "experience_status",
        ""
    )

    if matched:

        match_text = (
            "Your profile matches "
            + ", ".join(
                matched[:5]
            )
            + "."
        )

    else:

        match_text = (
            "The role has limited direct "
            "skill overlap with your profile."
        )

    if gaps:

        gap_text = (
            "The main areas to strengthen are "
            + ", ".join(
                gaps[:3]
            )
            + "."
        )

    else:

        gap_text = (
            "No major skill gaps were detected "
            "from the available job data."
        )

    return (
        f"This role has a {score}% match with your "
        f"profile. {match_text} {gap_text} "
        f"Experience assessment: "
        f"{experience_status}."
    )


# ============================================================
# AI JOB RECOMMENDATIONS
# ============================================================

@router.get("/recommendations")
def get_job_recommendations():
    """
    Career-aware job recommendation engine.

    Ranking priorities:
    1. Target role / role-family relevance
    2. Location
    3. Skill overlap
    4. Experience fit
    5. Entry-level suitability
    6. Work-mode compatibility

    Unrelated career families are strongly penalized so that
    generic skills such as Excel or PowerPoint cannot make an
    unrelated job outrank a relevant role.
    """

    target_role = (
        current_profile.target_role
        or ""
    ).strip()

    target_family = get_role_family(
        target_role
    )

    user_experience = (
        current_profile.experience_years
        or 0
    )

    user_skills = normalize_skills(
        current_profile.skills
    )

    user_location = normalize_text(
        current_profile.location
    )

    user_work_mode = normalize_text(
        current_profile.work_mode
    )

    try:

        response = (
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
                """
            )
            .eq(
                "is_active",
                True
            )
            .order(
                "posted_at",
                desc=True
            )
            .limit(500)
            .execute()
        )

        jobs = response.data or []

        recommendations = []

        # ----------------------------------------------------
        # LOCATION HELPERS
        # ----------------------------------------------------

        user_location_tokens = [
            token.strip()
            for token in re.split(
                r"[,|]",
                user_location
            )
            if token.strip()
        ]

        # ----------------------------------------------------
        # JOB LOOP
        # ----------------------------------------------------

        for job in jobs:

            title = normalize_text(
                job.get("title")
            )

            domain = normalize_text(
                job.get("domain")
            )

            roles_text = normalize_text(
                job.get("roles")
            )

            skills_text = normalize_text(
                job.get("skills")
            )

            employment_type = normalize_text(
                job.get("employment_type")
            )

            schedule_type = normalize_text(
                job.get("schedule_type")
            )

            job_location = normalize_text(
                job.get("location")
            )

            searchable_text = (
                f"{title} "
                f"{domain} "
                f"{roles_text} "
                f"{skills_text}"
            )

            # ------------------------------------------------
            # JOB FAMILY
            # ------------------------------------------------

            job_family = get_job_role_family(
                title,
                domain,
                roles_text
            )

            # ------------------------------------------------
            # SKILL MATCH
            # ------------------------------------------------

            matched_skills = find_matching_skills(
                user_skills,
                searchable_text
            )

            # Job's known normalized skills
            job_known_skills = extract_job_skills(
                skills_text
            )

            # Add skills detected from title / roles as well.
            searchable_known_skills = extract_job_skills(
                searchable_text
            )

            job_known_skills = (
                job_known_skills
                .union(searchable_known_skills)
            )

            # Canonical aliases for skill gaps.
            skill_alias_groups = {
                "excel": {
                    "excel",
                    "ms excel",
                    "microsoft excel",
                },
                "microsoft office": {
                    "ms office",
                    "microsoft office",
                    "microsoft office suite",
                    "ms office suite",
                },
                "powerpoint": {
                    "powerpoint",
                    "ms powerpoint",
                    "microsoft powerpoint",
                },
                "word": {
                    "word",
                    "ms word",
                    "microsoft word",
                },
                "tally erp": {
                    "tally",
                    "tally erp",
                    "tally erp 9",
                    "tallyprime",
                    "tally prime",
                },
                "salesforce": {
                    "salesforce",
                    "sfdc",
                },
            }

            canonical_user_skills = set()

            for skill in user_skills:

                matched_canonical = None

                for canonical, variants in (
                    skill_alias_groups.items()
                ):

                    if (
                        skill == canonical
                        or skill in variants
                    ):
                        matched_canonical = canonical
                        break

                canonical_user_skills.add(
                    matched_canonical
                    or skill
                )

            canonical_job_skills = set()

            for skill in job_known_skills:

                matched_canonical = None

                for canonical, variants in (
                    skill_alias_groups.items()
                ):

                    if (
                        skill == canonical
                        or skill in variants
                    ):
                        matched_canonical = canonical
                        break

                canonical_job_skills.add(
                    matched_canonical
                    or skill
                )

            canonical_overlap = (
                canonical_user_skills
                .intersection(
                    canonical_job_skills
                )
            )

            # Use actual displayed matched skills for UI.
            matched_skill_count = len(
                matched_skills
            )

            if user_skills:

                skill_score = min(
                    (
                        matched_skill_count
                        / max(
                            len(user_skills),
                            1
                        )
                    ) * 35,
                    35
                )

            else:

                skill_score = 0

            # ------------------------------------------------
            # ROLE MATCH
            # ------------------------------------------------

            direct_role_score = (
                role_text_match_score(
                    target_role,
                    title,
                    domain,
                    roles_text
                )
            )

            exact_family_match = (
                bool(target_family)
                and job_family == target_family
            )

            related_family_match = (
                role_family_matches(
                    target_family,
                    job_family
                )
            )

            # ------------------------------------------------
            # FAMILY / ROLE SCORE
            # ------------------------------------------------

            if exact_family_match:

                family_score = 25

            elif related_family_match:

                family_score = 12

            else:

                family_score = 0

            role_score = min(
                direct_role_score
                + family_score,
                35
            )

            # ------------------------------------------------
            # UNRELATED FAMILY PENALTY
            # ------------------------------------------------

            unrelated_family_penalty = 0

            if (
                target_family
                and job_family
                and not exact_family_match
                and not related_family_match
                and direct_role_score == 0
            ):

                unrelated_family_penalty = 20

            # ------------------------------------------------
            # EXPERIENCE
            # ------------------------------------------------

            min_experience = job.get(
                "min_experience"
            )

            max_experience = job.get(
                "max_experience"
            )

            experience_score = 8

            experience_status = (
                "Experience not specified"
            )

            try:

                min_exp = (
                    float(min_experience)
                    if min_experience is not None
                    else None
                )

                max_exp = (
                    float(max_experience)
                    if max_experience is not None
                    else None
                )

                if (
                    min_exp is None
                    and max_exp is None
                ):

                    experience_score = 8
                    experience_status = (
                        "Experience not specified"
                    )

                elif (
                    min_exp is not None
                    and max_exp is not None
                    and min_exp
                    <= user_experience
                    <= max_exp
                ):

                    experience_score = 15
                    experience_status = (
                        "Excellent Match"
                    )

                elif (
                    min_exp is not None
                    and user_experience >= min_exp
                ):

                    experience_score = 15
                    experience_status = (
                        "Good Match"
                    )

                elif (
                    min_exp is not None
                    and min_exp
                    <= user_experience + 1
                ):

                    experience_score = 11
                    experience_status = (
                        "Close Match"
                    )

                elif (
                    min_exp is not None
                    and min_exp
                    <= user_experience + 2
                ):

                    experience_score = 5
                    experience_status = (
                        "Experience Gap"
                    )

                else:

                    experience_score = 0
                    experience_status = (
                        "Not an Experience Match"
                    )

            except (
                TypeError,
                ValueError
            ):

                experience_score = 8
                experience_status = (
                    "Experience unclear"
                )

            # ------------------------------------------------
            # ENTRY LEVEL
            # ------------------------------------------------

            fresher_bonus = 0

            recommendation_type = (
                "Standard Match"
            )

            fresher_keywords = [
                "fresher",
                "entry level",
                "entry-level",
                "junior",
                "trainee",
                "graduate",
                "intern",
                "internship",
                "associate"
            ]

            fresher_signal = any(
                keyword in title
                or keyword in domain
                or keyword in roles_text
                or keyword in employment_type
                or keyword in schedule_type
                for keyword in fresher_keywords
            )

            if fresher_signal:

                fresher_bonus = 10

                recommendation_type = (
                    "Great for Freshers"
                )

            elif min_experience is not None:

                try:

                    if (
                        float(min_experience)
                        <= 1
                    ):

                        fresher_bonus = 8

                        recommendation_type = (
                            "Entry-Level Friendly"
                        )

                except (
                    TypeError,
                    ValueError
                ):

                    pass

            elif (
                min_experience is None
                and max_experience is None
            ):

                fresher_bonus = 6

                recommendation_type = (
                    "Potential Entry-Level Match"
                )

            # ------------------------------------------------
            # LOCATION
            # ------------------------------------------------

            # ------------------------------------------------
            # ROLE MATCH + SKILL GAP SIGNAL
            # ------------------------------------------------
            #
            # Strong direct role match + no matching skills
            # = role opportunity with a skill gap.
            #

            if (
                direct_role_score >= 25
                and len(matched_skills) == 0
            ):
                recommendation_type = (
                    "Role Match - Skill Gap"
                )

            elif (
                direct_role_score > 0
                and len(matched_skills) == 0
            ):
                recommendation_type = (
                    "Related Role - Skill Gap"
                )

            location_score = 0
            location_match = False

            if user_location:

                for token in user_location_tokens:

                    if (
                        token
                        and token in job_location
                    ):

                        location_match = True
                        break

                if (
                    "remote" in job_location
                    or "anywhere" in job_location
                ):

                    location_match = True

                if location_match:

                    # Location is now more important than
                    # the old +5 signal.
                    location_score = 10

            # ------------------------------------------------
            # WORK MODE
            # ------------------------------------------------

            work_mode_score = 0
            work_mode_match = False

            if user_work_mode:

                if (
                    user_work_mode in schedule_type
                    or user_work_mode in job_location
                ):

                    work_mode_match = True

                elif (
                    user_work_mode == "remote"
                    and "remote" in searchable_text
                ):

                    work_mode_match = True

                elif (
                    user_work_mode == "hybrid"
                    and "hybrid" in searchable_text
                ):

                    work_mode_match = True

                elif (
                    user_work_mode in [
                        "on-site",
                        "onsite",
                        "on site"
                    ]
                    and (
                        "on-site" in searchable_text
                        or "onsite" in searchable_text
                        or "on site" in searchable_text
                    )
                ):

                    work_mode_match = True

                if work_mode_match:

                    work_mode_score = 5

            # ------------------------------------------------
            # PRACTICAL SIGNAL
            # ------------------------------------------------

            practical_keywords = {
                "docker",
                "kubernetes",
                "fastapi",
                "mlflow",
                "airflow",
                "aws",
                "azure",
                "gcp"
            }

            practical_matches = (
                canonical_user_skills
                .intersection(
                    practical_keywords
                )
            )

            practical_score = min(
                len(practical_matches),
                5
            )

            # ------------------------------------------------
            # FINAL SCORE
            #
            # Skills       = 35
            # Role/family  = 35
            # Experience   = 15
            # Fresher      = 10
            # Location     = 10
            # Work mode    = 5
            #
            # Unrelated family penalty can reduce score.
            # ------------------------------------------------

            score_components = (
                round(skill_score)
                + round(role_score)
                + round(experience_score)
                + round(fresher_bonus)
                + round(location_score)
                + round(work_mode_score)
                - round(unrelated_family_penalty)
            )

            match_score = min(
                max(
                    score_components,
                    0
                ),
                100
            )

            # -------------------------------------------------
            # ROLE-ONLY MATCH CAP
            # -------------------------------------------------
            #
            # A strong role match without direct skill overlap
            # should not appear to be a strong skill match.
            #

            if (
                direct_role_score >= 25
                and len(matched_skills) == 0
            ):
                match_score = min(
                    match_score,
                    55
                )

            # ------------------------------------------------
            # RELEVANCE GATE
            # ------------------------------------------------

            meaningful_role_signal = (
                direct_role_score > 0
                or exact_family_match
                or related_family_match
            )

            meaningful_skill_signal = (
                len(
                    canonical_overlap
                ) > 0
            )

            # For a known career family, unrelated jobs need
            # strong direct role evidence or meaningful skill
            # overlap. Generic Excel/Word alone is not enough.
            if target_family:

                if (
                    not meaningful_role_signal
                    and not meaningful_skill_signal
                ):
                    continue

                if (
                    job_family
                    and job_family != target_family
                    and not related_family_match
                    and direct_role_score == 0
                    and len(canonical_overlap) < 2
                ):
                    continue

            else:

                if not (
                    meaningful_role_signal
                    or meaningful_skill_signal
                ):
                    continue

            # Large experience mismatch should not survive
            # unless the role alignment is exceptionally strong.
            if (
                experience_status
                == "Not an Experience Match"
                and direct_role_score < 20
            ):
                continue

            if match_score < 25:
                continue

            # ------------------------------------------------
            # MATCH REASONS
            # ------------------------------------------------

            match_reasons = []

            if matched_skills:

                match_reasons.append(
                    f"{len(matched_skills)} matching skills"
                )

            if direct_role_score >= 25:

                if len(matched_skills) == 0:

                    match_reasons.append(
                        "Strong target role alignment"
                    )

                    match_reasons.append(
                        "Skill gap identified"
                    )

                else:

                    match_reasons.append(
                        "Target role aligned"
                    )

            elif direct_role_score > 0:

                match_reasons.append(
                    "Partial target role alignment"
                )

            if exact_family_match:

                match_reasons.append(
                    "Exact career family match"
                )

            elif related_family_match:

                match_reasons.append(
                    "Related career family"
                )

            if job_family:

                match_reasons.append(
                    f"{job_family.replace('_', ' ').title()} role"
                )

            if (
                experience_status
                in [
                    "Excellent Match",
                    "Good Match"
                ]
            ):

                match_reasons.append(
                    "Experience aligned"
                )

            elif (
                experience_status
                == "Close Match"
            ):

                match_reasons.append(
                    "Close to required experience"
                )

            elif (
                experience_status
                == "Experience not specified"
            ):

                match_reasons.append(
                    "No strict experience requirement"
                )

            if fresher_bonus > 0:

                match_reasons.append(
                    "Entry-level friendly"
                )

            if location_match:

                match_reasons.append(
                    "Location preference matched"
                )

            if work_mode_match:

                match_reasons.append(
                    "Work mode matched"
                )

            if practical_score > 0:

                match_reasons.append(
                    "Good technical environment"
                )

            # ------------------------------------------------
            # SKILL GAPS
            # ------------------------------------------------

            skill_gaps = []

            for job_skill in sorted(
                job_known_skills
            ):

                job_skill_canonical = (
                    next(
                        (
                            canonical
                            for canonical, variants
                            in skill_alias_groups.items()
                            if (
                                job_skill == canonical
                                or job_skill in variants
                            )
                        ),
                        job_skill
                    )
                )

                if (
                    job_skill_canonical
                    not in canonical_user_skills
                ):

                    skill_gaps.append(
                        job_skill
                    )

            skill_gaps = unique_preserve_order(
                skill_gaps
            )[:5]

            recommendation = {

                "job_id":
                    job.get("job_id"),

                "title":
                    job.get("title"),

                "company_name":
                    job.get("company_name"),

                "location":
                    job.get("location"),

                "domain":
                    job.get("domain"),

                "roles":
                    job.get("roles"),

                "role_family":
                    job_family,

                "skills":
                    job.get("skills"),

                "min_experience":
                    min_experience,

                "max_experience":
                    max_experience,

                "employment_type":
                    job.get("employment_type"),

                "schedule_type":
                    job.get("schedule_type"),

                "min_salary":
                    job.get("min_salary"),

                "max_salary":
                    job.get("max_salary"),

                "posted_at":
                    job.get("posted_at"),

                "apply_url":
                    job.get("apply_url"),

                "match_score":
                    match_score,


                "direct_role_score":
                    direct_role_score,

                "matched_skills":
                    matched_skills,

                "skill_gaps":
                    skill_gaps,

                "match_reasons":
                    match_reasons,

                "experience_score":
                    experience_score,

                "experience_status":
                    experience_status,

                "fresher_bonus":
                    fresher_bonus,

                "recommendation_type":
                    recommendation_type,

                "location_match":
                    location_match,

                "work_mode_match":
                    work_mode_match,

                "practical_score":
                    practical_score,

                "role_signal_score":
                role_score,

            "score_breakdown": {
                "skill_score":
                    round(skill_score),

                "role_score":
                    round(role_score),

                "experience_score":
                    round(experience_score),

                "fresher_bonus":
                    round(fresher_bonus),

                "location_score":
                    round(location_score),

                "work_mode_score":
                    round(work_mode_score),

                "unrelated_family_penalty":
                    round(unrelated_family_penalty),

                "total":
                    match_score
            },

            "ai_explanation":
                ""}

            recommendation[
                "ai_explanation"
            ] = build_job_explanation(
                recommendation
            )

            recommendations.append(
                recommendation
            )

        # -----------------------------------------------------
        # SORT
        # -----------------------------------------------------

        recommendations.sort(
            key=lambda job: (
                job["match_score"],
                job["location_match"],
                job["role_signal_score"],
                job["experience_score"],
                len(job["matched_skills"]),
                job["fresher_bonus"]
            ),
            reverse=True
        )

        recommendations = recommendations[:10]

        return {

            "status":
                "success",

            "source":
                "matching_engine",

            "target_role":
                current_profile.target_role,

            "role_family":
                target_family,

            "user_experience":
                user_experience,

            "user_skills":
                sorted(
                    list(user_skills)
                ),

            "location":
                current_profile.location,

            "work_mode":
                current_profile.work_mode,

            "total_recommendations":
                len(recommendations),

            "message": (
                "No strong matching jobs found for the current "
                "career profile."
                if not recommendations
                else "Job recommendations generated successfully."
            ),

            "recommendations":
                recommendations
        }

    except Exception as e:

        print(
            "Career recommendation error:",
            str(e)
        )

        return {

            "status":
                "error",

            "message":
                str(e),

            "recommendations":
                []
        }


# ============================================================
# RESUME â†’ CAREER PROFILE INTEGRATION
# ============================================================

@router.post("/profile/from-resume")
def create_career_profile_from_resume(
    resume_profile: dict
):
    """
    Convert a parsed resume into a generic CareerProfile.

    The important design rule is:
    the resume determines the career direction.

    No default Data Scientist / Data Analyst / Chemist role is
    injected when the resume does not support it.
    """

    global current_profile

    if not isinstance(resume_profile, dict) or not resume_profile:

        return {
            "status": "error",
            "message": "Resume profile is empty."
        }

    # --------------------------------------------------------
    # Candidate
    # --------------------------------------------------------

    candidate = (
        resume_profile.get(
            "candidate",
            {}
        )
        or {}
    )

    # --------------------------------------------------------
    # Skills
    # --------------------------------------------------------

    skills_data = (
        resume_profile.get(
            "skills",
            {}
        )
        or {}
    )

    extracted_skills = []

    if isinstance(skills_data, dict):

        for value in skills_data.values():

            if isinstance(value, list):
                extracted_skills.extend(value)

            elif isinstance(value, str):
                extracted_skills.append(value)

    # Also support flat skill arrays from other resume parsers.
    for key in [
        "skills",
        "technical_skills",
        "soft_skills",
        "tools"
    ]:

        value = resume_profile.get(key)

        if isinstance(value, list):
            extracted_skills.extend(value)

        elif isinstance(value, str):
            extracted_skills.append(value)

    unique_skills = unique_preserve_order(
        extracted_skills
    )

    # --------------------------------------------------------
    # Experience
    # --------------------------------------------------------

    experience_data = (
        resume_profile.get(
            "experience",
            {}
        )
        or {}
    )

    technical_years = 0

    if isinstance(experience_data, dict):

        technical_years = (
            experience_data.get(
                "technical_years"
            )
            or experience_data.get(
                "years"
            )
            or experience_data.get(
                "total_years"
            )
            or 0
        )

    elif isinstance(
        experience_data,
        (int, float)
    ):

        technical_years = experience_data

    try:

        technical_years = float(
            technical_years or 0
        )

    except (
        TypeError,
        ValueError
    ):

        technical_years = 0

    # --------------------------------------------------------
    # Resume role signals
    # --------------------------------------------------------

    recommended_roles = (
        resume_profile.get(
            "recommended_roles",
            []
        )
        or []
    )

    if isinstance(
        recommended_roles,
        str
    ):
        recommended_roles = [
            recommended_roles
        ]

    recommended_roles = unique_preserve_order(
        recommended_roles
    )

    explicit_target_role = (
        resume_profile.get(
            "target_role"
        )
        or resume_profile.get(
            "desired_role"
        )
        or resume_profile.get(
            "target_position"
        )
        or ""
    )

    explicit_target_role = str(
        explicit_target_role
    ).strip()


    # --------------------------------------------------------
    # Candidate location
    # --------------------------------------------------------
    # Resume parser stores contact/location information
    # inside the "candidate" object.

    candidate_location = None

    if isinstance(candidate, dict):

        candidate_location = (
            candidate.get("location")
            or candidate.get("city")
            or candidate.get("current_location")
        )

    if not candidate_location:

        candidate_location = (
            resume_profile.get("location")
            or resume_profile.get("city")
            or resume_profile.get("current_location")
        )
    resume_text = extract_resume_text_signals(
        resume_profile
    )

    # --------------------------------------------------------
    # Determine target role
    # --------------------------------------------------------

    target_role = None

    # 1. Explicit target role from the parser is strongest.
    if explicit_target_role:

        generic_values = {
            "",
            "professional",
            "entry level professional",
            "candidate",
            "job seeker",
            "fresher",
            "student"
        }

        if normalize_text(
            explicit_target_role
        ) not in generic_values:

            target_role = (
                explicit_target_role
            )

    # 2. Use recommended roles only when they have evidence
    #    in the resume text/skills. This prevents a bad AI role
    #    list from hijacking the candidate profile.
    if not target_role:

        normalized_resume_text = normalize_text(
            resume_text
        )

        normalized_skills = normalize_skills(
            unique_skills
        )

        role_candidates = []

        for role in recommended_roles:

            role_normalized = normalize_text(
                role
            )

            if not role_normalized:
                continue

            evidence = 0

            if (
                role_normalized
                in normalized_resume_text
            ):
                evidence += 4

            family = get_role_family(
                role
            )

            if family:

                expected = {
                    normalize_skill_name(skill)
                    for skill
                    in ROLE_FAMILIES[
                        family
                    ].get(
                        "skills",
                        []
                    )
                }

                skill_overlap = len(
                    normalized_skills
                    .intersection(expected)
                )

                evidence += min(
                    skill_overlap,
                    5
                )

            if evidence > 0:
                role_candidates.append(
                    (
                        evidence,
                        role
                    )
                )

        if role_candidates:

            role_candidates.sort(
                key=lambda item: (
                    item[0],
                    -recommended_roles.index(
                        item[1]
                    )
                ),
                reverse=True
            )

            target_role = (
                role_candidates[0][1]
            )

    # 3. Infer a family only when there is clear skill evidence.
    if not target_role:

        normalized_resume_skills = normalize_skills(
            unique_skills
        )

        family_scores = {}

        for family, config in ROLE_FAMILIES.items():

            expected = {
                normalize_skill_name(skill)
                for skill
                in config.get(
                    "skills",
                    []
                )
            }

            matches = (
                normalized_resume_skills
                .intersection(expected)
            )

            # Use weighted evidence. Some skills are much more
            # role-specific than generic skills such as Excel,
            # Python or SQL.
            weighted_score = 0

            for skill in matches:

                if skill in {
                    "excel",
                    "sql",
                    "python",
                    "git",
                    "communication",
                    "statistics"
                }:
                    weighted_score += 1
                else:
                    weighted_score += 2

            family_scores[family] = weighted_score

        if family_scores:

            best_family = max(
                family_scores,
                key=family_scores.get
            )

            best_score = family_scores[
                best_family
            ]

            # Require actual evidence. A single generic skill
            # must never create a career family.
            if best_score >= 3:

                role_defaults = {

                    "data_science":
                        "Data Scientist",

                    "machine_learning":
                        "Machine Learning Engineer",

                    "data_analytics":
                        "Data Analyst",

                    "data_engineering":
                        "Data Engineer",

                    "web_development":
                        "Web Developer",

                    "finance":
                        "Financial Analyst",

                    "operations":
                        "Operations Executive"
                }

                target_role = role_defaults.get(
                    best_family
                )

    # 4. If no predefined family is supported, keep the profile
    #    generic rather than incorrectly labeling the person.
    if not target_role:

        target_role = (
            "Target Role"
        )

    # --------------------------------------------------------
    # Location
    # --------------------------------------------------------

    location = None

    if isinstance(candidate, dict):

        location = (
            candidate.get(
                "location"
            )
            or candidate.get(
                "city"
            )
            or None
        )

    if location:
        location = str(
            location
        ).strip()

    # --------------------------------------------------------
    # Build profile
    # --------------------------------------------------------

    current_profile = CareerProfile(
        target_role=target_role,
        experience_years=technical_years,
        skills=unique_skills,
        location=candidate_location,
        work_mode=None
    )

    role_family = get_role_family(
        target_role
    )

    match_score = (
        calculate_career_match_score()
    )

    return {

        "status":
            "success",

        "message":
            (
                "Career profile created from "
                "resume successfully."
            ),

        "profile": {

            "target_role":
                current_profile.target_role,

            "role_family":
                role_family,

            "experience_years":
                current_profile.experience_years,

            "experience_level":
                get_experience_level(),

            "skills":
                current_profile.skills,

            "location":
                current_profile.location,

            "work_mode":
                current_profile.work_mode,

            "match_score":
                match_score
        },

        "recommended_roles":
            recommended_roles
    }


# ============================================================
# ============================================================
# CAREER ASSISTANT
# ============================================================

@router.post("/assistant")
def career_assistant(
    payload: dict
):
    """
    CareerAI conversational assistant.

    Uses the current CareerProfile and Gemini when available.
    If Gemini is unavailable or quota is exhausted, a deterministic
    fallback response is returned so the frontend continues working.
    """

    global current_profile

    # --------------------------------------------------------
    # VALIDATE REQUEST
    # --------------------------------------------------------

    if not isinstance(payload, dict):

        return {
            "status": "error",
            "message": "Invalid request body."
        }

    message = (
        payload.get("message")
        or ""
    )

    message = str(
        message
    ).strip()

    if not message:

        return {
            "status": "error",
            "message": (
                "Please enter a career-related question."
            )
        }

    if len(message) > 2000:

        return {
            "status": "error",
            "message": (
                "Message is too long. "
                "Please keep it under 2000 characters."
            )
        }

    # --------------------------------------------------------
    # CURRENT PROFILE
    # --------------------------------------------------------

    target_role = (
        current_profile.target_role
        or "Target Role"
    )

    experience_years = (
        current_profile.experience_years
        or 0
    )

    skills = [
        str(skill).strip()
        for skill in (
            current_profile.skills
            or []
        )
        if str(skill).strip()
    ]

    location = (
        current_profile.location
        or "Not specified"
    )

    work_mode = (
        current_profile.work_mode
        or "Not specified"
    )

    # --------------------------------------------------------
    # ROLE FAMILY
    # --------------------------------------------------------

    target_family = get_role_family(
        target_role
    )

    role_config = ROLE_FAMILIES.get(
        target_family,
        {}
    )

    role_skills = [
        normalize_skill_name(skill)
        for skill in role_config.get(
            "skills",
            []
        )
    ]

    user_skills_normalized = normalize_skills(
        skills
    )

    missing_role_skills = [
        skill
        for skill in role_skills
        if skill not in user_skills_normalized
    ]

    matched_role_skills = [
        skill
        for skill in role_skills
        if skill in user_skills_normalized
    ]

    # --------------------------------------------------------
    # DETECT QUESTION TYPE
    # --------------------------------------------------------

    question_lower = normalize_text(
        message
    )

    asks_skills = any(
        keyword in question_lower
        for keyword in [
            "skill",
            "skills",
            "improve",
            "learn",
            "gap",
            "gaps",
            "missing",
            "weakness"
        ]
    )

    asks_readiness = any(
        keyword in question_lower
        for keyword in [
            "ready",
            "readiness",
            "qualified",
            "qualification",
            "can i get",
            "am i suitable",
            "suitable"
        ]
    )

    asks_career_path = any(
        keyword in question_lower
        for keyword in [
            "career path",
            "career direction",
            "next role",
            "next step",
            "roadmap",
            "progress"
        ]
    )

    # --------------------------------------------------------
    # GEMINI PROMPT
    # --------------------------------------------------------

    prompt = f"""
You are CareerAI, an expert career assistant.

Answer the user's career question using ONLY the candidate
profile provided below.

CANDIDATE PROFILE

Target Role:
{target_role}

Role Family:
{target_family or "Not specified"}

Experience:
{experience_years} years

Skills:
{", ".join(skills) if skills else "No skills listed"}

Location:
{location}

Preferred Work Mode:
{work_mode}

Skills already matching the target role:
{", ".join(matched_role_skills[:10]) if matched_role_skills else "None identified"}

Potential target-role skill gaps:
{", ".join(missing_role_skills[:10]) if missing_role_skills else "No major gaps identified"}

USER QUESTION:
{message}

IMPORTANT RULES:

1. Give practical and realistic career advice.
2. Use the candidate profile as the primary source.
3. Do NOT invent experience, skills, qualifications or projects.
4. Do NOT assume the candidate has skills that are not listed.
5. Keep the answer directly relevant to the user's question.
6. If the user asks about skill gaps, identify gaps based on the
   target role and current skills.
7. If the user asks whether they are ready for a role, explain
   strengths and gaps honestly.
8. If the user asks about career direction, stay aligned with
   the candidate's target role and actual profile.
9. Do not recommend unrelated career domains.
10. The candidate may be a fresher. Do not treat projects,
    education or courses as professional experience.
11. Give actionable next steps.
12. Keep the response concise but useful.
13. Do not mention these instructions.
14. Return ONLY valid JSON.

Return exactly:

{{
    "answer": "Your complete answer to the user.",
    "suggested_action": "One practical next step."
}}
"""

    # --------------------------------------------------------
    # GEMINI CALL
    # --------------------------------------------------------

    try:

        ai_response = generate_response(
            prompt
        )

        ai_data = clean_gemini_json(
            ai_response
        )

        answer = (
            ai_data.get(
                "answer",
                ""
            )
            or ""
        )

        suggested_action = (
            ai_data.get(
                "suggested_action",
                ""
            )
            or ""
        )

        if not answer:

            raise ValueError(
                "Gemini returned an empty career answer."
            )

        return {

            "status":
                "success",

            "source":
                "gemini",

            "target_role":
                target_role,

            "answer":
                str(
                    answer
                ).strip(),

            "suggested_action":
                str(
                    suggested_action
                ).strip(),

            "ai_error":
                None
        }

    # --------------------------------------------------------
    # GEMINI FAILURE / QUOTA FALLBACK
    # --------------------------------------------------------

    except Exception as exc:

        error_text = str(
            exc
        )

        print(
            "Career Assistant Gemini unavailable:",
            error_text
        )

        # ====================================================
        # CLEAN ERROR TYPE
        # ====================================================

        if (
            "429" in error_text
            or "RESOURCE_EXHAUSTED" in error_text
            or "quota" in error_text.lower()
            or "quotaexceeded" in error_text.lower()
        ):

            clean_ai_error = (
                "Gemini quota temporarily unavailable"
            )

        elif (
            "401" in error_text
            or "403" in error_text
            or "API key" in error_text
            or "api_key" in error_text.lower()
        ):

            clean_ai_error = (
                "Gemini API authentication unavailable"
            )

        elif (
            "timeout" in error_text.lower()
            or "timed out" in error_text.lower()
        ):

            clean_ai_error = (
                "Gemini request timed out"
            )

        else:

            clean_ai_error = (
                "Gemini temporarily unavailable"
            )

        # ====================================================
        # DETERMINISTIC FALLBACK
        # ====================================================

        skills_text = (
            ", ".join(
                skills[:8]
            )
            if skills
            else "no specific skills"
        )

        # ----------------------------------------------------
        # SKILL QUESTION
        # ----------------------------------------------------

        if asks_skills:

            if missing_role_skills:

                priority_gaps = (
                    missing_role_skills[:5]
                )

                gap_text = ", ".join(
                    skill.title()
                    for skill
                    in priority_gaps
                )

                fallback_answer = (
                    f"Based on your current profile, "
                    f"your target role is {target_role}. "
                    f"You currently have {experience_years:g} "
                    f"years of experience and skills including "
                    f"{skills_text}. "
                    f"The most relevant skills to strengthen next "
                    f"for this role are {gap_text}. "
                    f"Prioritize the first 2â€“3 skills and build "
                    f"practical projects around them."
                )

                fallback_action = (
                    f"Start with {priority_gaps[0].title()} "
                    f"and build one practical {target_role} "
                    f"project using it."
                )

            else:

                fallback_answer = (
                    f"Your current skills show good alignment "
                    f"with {target_role}. Focus next on "
                    f"deepening your existing skills, building "
                    f"production-style projects and reviewing "
                    f"recent {target_role} job descriptions "
                    f"to identify additional requirements."
                )

                fallback_action = (
                    f"Review 5 current {target_role} job "
                    f"descriptions and identify the three "
                    f"most frequently requested skills."
                )

        # ----------------------------------------------------
        # READINESS QUESTION
        # ----------------------------------------------------

        elif asks_readiness:

            if matched_role_skills:

                matched_text = ", ".join(
                    skill.title()
                    for skill
                    in matched_role_skills[:5]
                )

            else:

                matched_text = (
                    "no major role-specific skills"
                )

            if missing_role_skills:

                gap_text = ", ".join(
                    skill.title()
                    for skill
                    in missing_role_skills[:4]
                )

            else:

                gap_text = (
                    "no major gaps identified"
                )

            fallback_answer = (
                f"You have a foundation for "
                f"{target_role} roles, with relevant skills "
                f"including {matched_text}. "
                f"However, your profile also shows areas to "
                f"strengthen, particularly {gap_text}. "
                f"As an entry-level candidate, focus on "
                f"demonstrable projects and role-specific "
                f"interview preparation rather than assuming "
                f"professional experience."
            )

            fallback_action = (
                f"Compare your resume against 5 entry-level "
                f"{target_role} job descriptions and close "
                f"the most common skill gaps."
            )

        # ----------------------------------------------------
        # CAREER PATH QUESTION
        # ----------------------------------------------------

        elif asks_career_path:

            fallback_answer = (
                f"Your current career direction should stay "
                f"focused on {target_role}. "
                f"With {experience_years:g} years of experience, "
                f"the immediate priority is to strengthen your "
                f"role-specific skills, build practical evidence "
                f"through projects and target entry-level or "
                f"junior opportunities aligned with your profile."
            )

            fallback_action = (
                f"Create a 30-day plan focused on the core "
                f"skills required for {target_role} and complete "
                f"one portfolio project."
            )

        # ----------------------------------------------------
        # GENERAL CAREER QUESTION
        # ----------------------------------------------------

        else:

            fallback_answer = (
                f"Based on your current profile, your target "
                f"role is {target_role}. You currently have "
                f"{experience_years:g} years of experience and "
                f"skills including {skills_text}. "
                f"Focus on strengthening the skills most directly "
                f"required for {target_role}, building practical "
                f"projects and applying to roles that match your "
                f"current experience level."
            )

            fallback_action = (
                f"Review current {target_role} job requirements "
                f"and identify your top three skill gaps."
            )

        # ----------------------------------------------------
        # SAFE FALLBACK RESPONSE
        # ----------------------------------------------------

        return {

            "status":
                "success",

            "source":
                "fallback",

            "target_role":
                target_role,

            "answer":
                fallback_answer,

            "suggested_action":
                fallback_action,

            "ai_error":
                clean_ai_error
        }
