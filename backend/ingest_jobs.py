import json
import os
from datetime import datetime

import ijson
from dotenv import load_dotenv
from supabase import create_client


# ============================================================
# CONFIG
# ============================================================

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

DATASET_PATH = r"C:\Users\PAWAN PRASAD\Downloads\query_result_2026-08-19T11_42_24.242228274Z - Copy.json"

# Smaller batch = safer for Supabase
BATCH_SIZE = 200

# Supabase returns a limited number of rows per request.
FETCH_PAGE_SIZE = 1000


if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL / SUPABASE_KEY missing from .env")


# ============================================================
# SUPABASE CLIENT
# ============================================================

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)


# ============================================================
# HELPERS
# ============================================================

def clean_text(value):
    """Convert a value into clean text or None."""
    if value is None:
        return None

    if isinstance(value, list):
        return ", ".join(str(x) for x in value if x is not None)

    if isinstance(value, dict):
        return json.dumps(value, ensure_ascii=False)

    value = str(value).strip()

    return value if value else None


def to_int(value):
    """Safely convert value to integer."""
    if value is None or value == "":
        return None

    try:
        return int(float(value))
    except (ValueError, TypeError):
        return None


def to_float(value):
    """Safely convert value to float."""
    if value is None or value == "":
        return None

    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def parse_datetime(value):
    """
    Convert common date formats into ISO timestamp.
    Returns None if parsing fails.
    """

    if value is None or value == "":
        return None

    if isinstance(value, datetime):
        return value.isoformat()

    value = str(value).strip()

    # Already ISO-like
    try:
        return datetime.fromisoformat(
            value.replace("Z", "+00:00")
        ).isoformat()
    except ValueError:
        pass

    formats = [
        "%Y/%m/%d, %H:%M",
        "%Y/%m/%d %H:%M",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
        "%d/%m/%Y, %H:%M",
        "%d/%m/%Y %H:%M",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(value, fmt).isoformat()
        except ValueError:
            continue

    return None


# ============================================================
# FIELD EXTRACTION
# ============================================================

def get_value(record, *keys):
    """
    Return first available value from possible key names.
    """

    for key in keys:
        if key in record and record[key] is not None:
            return record[key]

    return None


def transform_job(record):
    """
    Convert raw JSON job record into public.jobs schema.
    """

    job_id = get_value(
        record,
        "job_id",
        "jobId",
        "id"
    )

    if job_id is None:
        return None

    job_id = str(job_id).strip()

    if not job_id:
        return None

    job = {
        "job_id": job_id,

        "source": clean_text(
            get_value(record, "source", "via")
        ),

        "title": clean_text(
            get_value(record, "title", "job_title", "jobTitle")
        ),

        "company_name": clean_text(
            get_value(
                record,
                "company_name",
                "company",
                "companyName"
            )
        ),

        "description": clean_text(
            get_value(
                record,
                "description",
                "job_description",
                "jobDescription"
            )
        ),

        "formatted_description": clean_text(
            get_value(
                record,
                "formatted_description",
                "formattedDescription"
            )
        ),

        "location": clean_text(
            get_value(record, "location")
        ),

        "location_requirement": clean_text(
            get_value(
                record,
                "location_requirement",
                "locationRequirement"
            )
        ),

        "domain": clean_text(
            get_value(record, "domain")
        ),

        "roles": clean_text(
            get_value(record, "roles", "role")
        ),

        "skills": clean_text(
            get_value(record, "skills", "skill")
        ),

        "min_experience": to_int(
            get_value(
                record,
                "min_experience",
                "minExperience"
            )
        ),

        "max_experience": to_int(
            get_value(
                record,
                "max_experience",
                "maxExperience"
            )
        ),

        "employment_type": clean_text(
            get_value(
                record,
                "employment_type",
                "employmentType"
            )
        ),

        "schedule_type": clean_text(
            get_value(
                record,
                "schedule_type",
                "scheduleType"
            )
        ),

        "min_salary": to_float(
            get_value(
                record,
                "min_salary",
                "minSalary"
            )
        ),

        "max_salary": to_float(
            get_value(
                record,
                "max_salary",
                "maxSalary"
            )
        ),

        "posted_at": parse_datetime(
            get_value(
                record,
                "posted_at",
                "postedAt",
                "date"
            )
        ),

        "published_at": parse_datetime(
            get_value(
                record,
                "published_at",
                "publishedAt"
            )
        ),

        "apply_url": clean_text(
            get_value(
                record,
                "apply_url",
                "applyUrl",
                "url"
            )
        ),

        "apply_options": get_value(
            record,
            "apply_options",
            "applyOptions"
        ),

        "thumbnail": clean_text(
            get_value(record, "thumbnail")
        ),

        "query": clean_text(
            get_value(record, "query")
        ),

        "relevant_score": to_float(
            get_value(record, "relevant_score")
        ),

        "data_quality_score": to_float(
            get_value(record, "data_quality_score")
        ),

        "is_active": True,
    }

    return job


# ============================================================
# GET EXISTING JOB IDS
# ============================================================

def get_existing_job_ids():

    print()
    print("=" * 70)
    print("CHECKING EXISTING JOBS IN SUPABASE")
    print("=" * 70)

    existing_ids = set()
    start = 0

    while True:

        end = start + FETCH_PAGE_SIZE - 1

        try:
            response = (
                supabase
                .table("jobs")
                .select("job_id")
                .range(start, end)
                .execute()
            )

            rows = response.data or []

        except Exception as e:

            print()
            print("ERROR while reading existing job IDs:")
            print(e)
            raise

        if not rows:
            break

        for row in rows:
            job_id = row.get("job_id")

            if job_id:
                existing_ids.add(str(job_id))

        print(
            f"Existing jobs loaded: {len(existing_ids):,}"
        )

        if len(rows) < FETCH_PAGE_SIZE:
            break

        start += FETCH_PAGE_SIZE

    print()
    print(
        f"Existing unique job IDs: {len(existing_ids):,}"
    )

    return existing_ids


# ============================================================
# UPLOAD BATCH
# ============================================================

def upload_batch(batch):

    if not batch:
        return 0

    try:

        response = (
            supabase
            .table("jobs")
            .insert(batch)
            .execute()
        )

        return len(response.data or batch)

    except Exception as e:

        print()
        print("=" * 70)
        print("BATCH FAILED")
        print("=" * 70)
        print(f"Batch size: {len(batch)}")
        print(f"Error: {e}")
        print()

        # Retry smaller pieces if a batch fails.
        if len(batch) > 1:

            print(
                f"Retrying batch of {len(batch)} "
                f"as individual records..."
            )

            success = 0

            for job in batch:

                try:

                    (
                        supabase
                        .table("jobs")
                        .insert(job)
                        .execute()
                    )

                    success += 1

                except Exception as single_error:

                    print(
                        f"Failed job_id={job.get('job_id')}: "
                        f"{single_error}"
                    )

            return success

        else:

            print(
                f"Failed job_id={batch[0].get('job_id')}: {e}"
            )

            return 0


# ============================================================
# MAIN INGESTION
# ============================================================

def ingest():

    print("=" * 70)
    print("AI JOB BOARD - RESUMABLE SUPABASE INGESTION")
    print("=" * 70)

    print()
    print(f"Dataset: {DATASET_PATH}")
    print(f"Batch size: {BATCH_SIZE}")
    print()

    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(
            f"Dataset not found:\n{DATASET_PATH}"
        )

    # --------------------------------------------------------
    # Load existing IDs
    # --------------------------------------------------------

    existing_ids = get_existing_job_ids()

    print()
    print("=" * 70)
    print("STARTING STREAMING INGESTION")
    print("=" * 70)
    print()

    total_records = 0
    skipped_records = 0
    invalid_records = 0
    uploaded_records = 0

    batch = []

    # --------------------------------------------------------
    # Stream JSON using ijson
    # --------------------------------------------------------

    with open(
        DATASET_PATH,
        "rb"
    ) as file:

        # Dataset is expected to be a top-level JSON array.
        records = ijson.items(file, "item")

        for record in records:

            total_records += 1

            if not isinstance(record, dict):
                invalid_records += 1
                continue

            job = transform_job(record)

            if job is None:
                invalid_records += 1
                continue

            job_id = job["job_id"]

            # ------------------------------------------------
            # IMPORTANT:
            # Skip records already in Supabase
            # ------------------------------------------------

            if job_id in existing_ids:

                skipped_records += 1
                continue

            batch.append(job)

            # Add to set immediately so duplicates inside
            # the same dataset are also skipped.
            existing_ids.add(job_id)

            # ------------------------------------------------
            # Upload batch
            # ------------------------------------------------

            if len(batch) >= BATCH_SIZE:

                uploaded = upload_batch(batch)

                uploaded_records += uploaded

                print(
                    f"Processed: {total_records:,} | "
                    f"Uploaded: {uploaded_records:,} | "
                    f"Skipped: {skipped_records:,}"
                )

                batch = []

    # --------------------------------------------------------
    # Upload remaining records
    # --------------------------------------------------------

    if batch:

        uploaded = upload_batch(batch)

        uploaded_records += uploaded

    # --------------------------------------------------------
    # FINAL SUMMARY
    # --------------------------------------------------------

    print()
    print("=" * 70)
    print("INGESTION COMPLETE")
    print("=" * 70)

    print()
    print(f"Total records scanned : {total_records:,}")
    print(f"Already existed       : {skipped_records:,}")
    print(f"New records uploaded  : {uploaded_records:,}")
    print(f"Invalid records       : {invalid_records:,}")

    print()
    print("=" * 70)


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    ingest()