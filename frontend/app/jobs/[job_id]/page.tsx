"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Briefcase,
  Clock,
  ExternalLink,
  CalendarDays,
  CheckCircle2,
  DollarSign,
  Users,
  GraduationCap,
  Gift,
  Code2,
  UserRound,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

/* ============================================================
   TYPES
============================================================ */

type ApplyOption = {
  link: string;
  title: string;
};

type Job = {
  job_id: string;
  source: string;
  title: string;
  company_name: string;

  description?: string | null;
  formatted_description?: string | null;

  location: string | null;
  location_requirement?: string | null;

  domain: string | null;
  roles: string | null;
  skills: string | null;

  min_experience: number | null;
  max_experience: number | null;

  employment_type: string | null;
  schedule_type: string | null;

  min_salary: number | null;
  max_salary: number | null;

  posted_at: string | null;
  published_at?: string | null;

  apply_url: string | null;

  apply_options?: string | ApplyOption[] | null;
};

/* ============================================================
   CLEAN TEXT
============================================================ */

function cleanText(
  value: string | null | undefined
): string {
  if (!value) {
    return "";
  }

  return value
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€¢/g, "•")
    .replace(/â€“/g, "–")
    .replace(/â€”/g, "—")
    .replace(/â€¦/g, "...")
    .replace(/Â/g, "")
    .replace(/Fullâtime/gi, "Full-time")
    .replace(/Partâtime/gi, "Part-time")
    .trim();
}

/* ============================================================
   CLEAN DESCRIPTION
============================================================ */

function cleanDescription(
  value: string | null | undefined
): string {
  if (!value) {
    return "";
  }

  let text = cleanText(value);

  /*
   * Normalize common heading formats.
   * Backend can return:
   *
   * #### Key Responsibilities
   * #### Benefits
   * #### Technical Skills
   * etc.
   */

  text = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  /*
   * Remove excessive blank lines.
   */

  text = text.replace(/\n{3,}/g, "\n\n");

  /*
   * Make sure headings have spacing around them.
   */

  text = text.replace(
    /(^|\n)\s*(#{1,6})\s*(Key Responsibilities|Key Responsibilities:|Responsibilities|Responsibilities:)\s*/gi,
    "$1\n### Key Responsibilities\n"
  );

  text = text.replace(
    /(^|\n)\s*(#{1,6})\s*(Benefits|Benefits:)\s*/gi,
    "$1\n### Benefits\n"
  );

  text = text.replace(
    /(^|\n)\s*(#{1,6})\s*(Technical Skills|Technical Skills:|Skills|Skills:)\s*/gi,
    "$1\n### Technical Skills\n"
  );

  text = text.replace(
    /(^|\n)\s*(#{1,6})\s*(Qualifications|Qualifications:|Qualification|Qualification:)\s*/gi,
    "$1\n### Qualifications\n"
  );

  text = text.replace(
    /(^|\n)\s*(#{1,6})\s*(Location|Location:)\s*/gi,
    "$1\n### Location\n"
  );

  text = text.replace(
    /(^|\n)\s*(#{1,6})\s*(Reporting To|Reporting To:|Reports To|Reports To:)\s*/gi,
    "$1\n### Reporting To\n"
  );

  return text.trim();
}

/* ============================================================
   PARSE LIST
============================================================ */

function parseList(
  value: string | null | undefined
): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/[,|\n]/)
    .map((item) => cleanText(item))
    .map((item) => item.trim())
    .filter(
      (item) =>
        item.length > 0 &&
        item.toLowerCase() !== "not mentioned"
    );
}

/* ============================================================
   PARSE APPLY OPTIONS
============================================================ */

function parseApplyOptions(
  value: string | ApplyOption[] | null | undefined
): ApplyOption[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(
      (item) =>
        item &&
        item.link &&
        item.title
    );
  }

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item) =>
          item &&
          item.link &&
          item.title
      );
    }
  } catch {
    return [];
  }

  return [];
}

/* ============================================================
   SECTION ICON
============================================================ */

function getSectionIcon(
  heading: string
) {
  const normalized =
    heading.toLowerCase();

  if (
    normalized.includes("responsibil")
  ) {
    return (
      <Users
        size={19}
        className="text-blue-600"
      />
    );
  }

  if (
    normalized.includes("benefit")
  ) {
    return (
      <Gift
        size={19}
        className="text-green-600"
      />
    );
  }

  if (
    normalized.includes("technical") ||
    normalized === "skills"
  ) {
    return (
      <Code2
        size={19}
        className="text-purple-600"
      />
    );
  }

  if (
    normalized.includes("qualification")
  ) {
    return (
      <GraduationCap
        size={19}
        className="text-orange-600"
      />
    );
  }

  if (
    normalized.includes("location")
  ) {
    return (
      <MapPin
        size={19}
        className="text-red-600"
      />
    );
  }

  if (
    normalized.includes("report")
  ) {
    return (
      <UserRound
        size={19}
        className="text-indigo-600"
      />
    );
  }

  return (
    <CheckCircle2
      size={19}
      className="text-blue-600"
    />
  );
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function JobDetails() {
  const params = useParams();
  const router = useRouter();

  const jobId =
    params.job_id as string;

  const [job, setJob] =
    useState<Job | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* ==========================================================
     FETCH JOB
  ========================================================== */

  useEffect(() => {
    async function fetchJob() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_URL}/api/jobs/${jobId}`,
            {
              cache: "no-store",
            }
          );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch job"
          );
        }

        const data =
          await response.json();

        if (
          data.status !==
            "success" ||
          !data.job
        ) {
          throw new Error(
            "Job not found"
          );
        }

        setJob(data.job);
      } catch (err) {
        console.error(
          "Job details error:",
          err
        );

        setError(
          "Unable to load job details."
        );
      } finally {
        setLoading(false);
      }
    }

    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="text-slate-600">
            Loading job details...
          </p>
        </div>
      </main>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (error || !job) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="mb-5 text-red-500">
            {error ||
              "Job not found."}
          </p>

          <button
            onClick={() =>
              router.back()
            }
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
      </main>
    );
  }

  /* ==========================================================
     DERIVED DATA
  ========================================================== */

  const experience =
    job.min_experience !== null
      ? job.max_experience !==
          null &&
        job.max_experience !==
          job.min_experience
        ? `${job.min_experience} - ${job.max_experience} years`
        : `${job.min_experience} years`
      : "Not specified";

  const postedDate =
    job.posted_at
      ? new Date(
          job.posted_at
        ).toLocaleDateString(
          "en-IN",
          {
            day: "numeric",
            month: "short",
            year: "numeric",
          }
        )
      : "Not specified";

  const description =
    cleanDescription(
      job.formatted_description ||
        job.description ||
        ""
    );

  const roles =
    parseList(job.roles);

  const skills =
    parseList(job.skills);

  const applyOptions =
    parseApplyOptions(
      job.apply_options
    );

  const primaryApplyUrl =
    job.apply_url ||
    applyOptions[0]?.link ||
    null;

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <main className="min-h-screen bg-slate-50">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <button
            onClick={() =>
              router.back()
            }
            className="flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
          >
            <ArrowLeft size={18} />
            Back to Jobs
          </button>

          <div className="text-xl font-bold">
            <span className="text-slate-900">
              Career
            </span>

            <span className="text-blue-600">
              AI
            </span>
          </div>

        </div>

      </header>

      {/* ======================================================
          MAIN PAGE
      ====================================================== */}

      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* ====================================================
            JOB HEADER
        ==================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

            <div className="flex gap-5">

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Building2 size={30} />
              </div>

              <div>

                <p className="mb-1 text-sm font-medium text-blue-600">
                  {cleanText(
                    job.domain
                  ) ||
                    "Career Opportunity"}
                </p>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                  {cleanText(
                    job.title
                  )}
                </h1>

                <p className="mt-2 text-lg font-medium text-slate-600">
                  {cleanText(
                    job.company_name
                  )}
                </p>

              </div>

            </div>

            {primaryApplyUrl && (
              <a
                href={
                  primaryApplyUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Apply Now

                <ExternalLink
                  size={18}
                />
              </a>
            )}

          </div>

          {/* JOB META */}

          <div className="mt-7 flex flex-wrap gap-3">

            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
              <MapPin size={16} />

              {cleanText(
                job.location
              ) ||
                "Location not specified"}
            </span>

            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm text-blue-700">
              <Briefcase size={16} />

              {cleanText(
                job.domain
              ) || "General"}
            </span>

            <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm text-green-700">
              <Clock size={16} />

              {experience}
            </span>

            {job.employment_type && (
              <span className="rounded-full bg-purple-50 px-4 py-2 text-sm text-purple-700">
                {cleanText(
                  job.employment_type
                )}
              </span>
            )}

            {job.location_requirement && (
              <span className="rounded-full bg-orange-50 px-4 py-2 text-sm text-orange-700">
                {cleanText(
                  job.location_requirement
                )}
              </span>
            )}

          </div>

        </section>

        {/* ====================================================
            CONTENT GRID
        ==================================================== */}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">

          {/* ==================================================
              LEFT CONTENT
          ================================================== */}

          <div className="space-y-6 lg:col-span-2">

            {/* =================================================
                JOB DESCRIPTION
            ================================================= */}

            <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Briefcase
                    size={20}
                  />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Job Description
                  </h2>

                  <p className="mt-0.5 text-sm text-slate-500">
                    Role overview and responsibilities
                  </p>
                </div>

              </div>

              <div className="mt-6">

                {description ? (

                  <ReactMarkdown
                    components={{

                      /* ---------------------------------------
                         HEADINGS
                      --------------------------------------- */

                      h1: ({
                        children,
                      }) => (
                        <div className="mb-5 mt-8 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                          {getSectionIcon(
                            String(
                              children
                            )
                          )}

                          <h1 className="text-xl font-bold text-slate-900">
                            {children}
                          </h1>
                        </div>
                      ),

                      h2: ({
                        children,
                      }) => (
                        <div className="mb-5 mt-8 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                          {getSectionIcon(
                            String(
                              children
                            )
                          )}

                          <h2 className="text-xl font-bold text-slate-900">
                            {children}
                          </h2>
                        </div>
                      ),

                      h3: ({
                        children,
                      }) => (
                        <div className="mb-4 mt-8 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                          {getSectionIcon(
                            String(
                              children
                            )
                          )}

                          <h3 className="text-lg font-bold text-slate-900">
                            {children}
                          </h3>
                        </div>
                      ),

                      h4: ({
                        children,
                      }) => (
                        <div className="mb-4 mt-8 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                          {getSectionIcon(
                            String(
                              children
                            )
                          )}

                          <h4 className="text-lg font-bold text-slate-900">
                            {children}
                          </h4>
                        </div>
                      ),

                      h5: ({
                        children,
                      }) => (
                        <div className="mb-4 mt-7 flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
                          {getSectionIcon(
                            String(
                              children
                            )
                          )}

                          <h5 className="font-bold text-slate-900">
                            {children}
                          </h5>
                        </div>
                      ),

                      h6: ({
                        children,
                      }) => (
                        <div className="mb-3 mt-6 flex items-center gap-2">
                          {getSectionIcon(
                            String(
                              children
                            )
                          )}

                          <h6 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                            {children}
                          </h6>
                        </div>
                      ),

                      /* ---------------------------------------
                         PARAGRAPH
                      --------------------------------------- */

                      p: ({
                        children,
                      }) => (
                        <p className="mb-4 leading-7 text-slate-600">
                          {children}
                        </p>
                      ),

                      /* ---------------------------------------
                         UNORDERED LIST
                      --------------------------------------- */

                      ul: ({
                        children,
                      }) => (
                        <ul className="mb-6 ml-1 space-y-3">
                          {children}
                        </ul>
                      ),

                      /* ---------------------------------------
                         ORDERED LIST
                      --------------------------------------- */

                      ol: ({
                        children,
                      }) => (
                        <ol className="mb-6 ml-6 list-decimal space-y-3 text-slate-600">
                          {children}
                        </ol>
                      ),

                      /* ---------------------------------------
                         LIST ITEM
                      --------------------------------------- */

                      li: ({
                        children,
                      }) => (
                        <li className="flex items-start gap-3 leading-7 text-slate-600">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />

                          <span className="flex-1">
                            {children}
                          </span>
                        </li>
                      ),

                      /* ---------------------------------------
                         BOLD
                      --------------------------------------- */

                      strong: ({
                        children,
                      }) => (
                        <strong className="font-bold text-slate-900">
                          {children}
                        </strong>
                      ),

                      /* ---------------------------------------
                         ITALIC
                      --------------------------------------- */

                      em: ({
                        children,
                      }) => (
                        <em className="text-slate-700">
                          {children}
                        </em>
                      ),

                      /* ---------------------------------------
                         LINKS
                      --------------------------------------- */

                      a: ({
                        href,
                        children,
                      }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {children}
                        </a>
                      ),

                      /* ---------------------------------------
                         BLOCKQUOTE
                      --------------------------------------- */

                      blockquote: ({
                        children,
                      }) => (
                        <blockquote className="my-5 border-l-4 border-blue-500 bg-blue-50 px-5 py-4 text-slate-700">
                          {children}
                        </blockquote>
                      ),

                      /* ---------------------------------------
                         CODE
                      --------------------------------------- */

                      code: ({
                        children,
                      }) => (
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-800">
                          {children}
                        </code>
                      ),

                    }}
                  >
                    {description}
                  </ReactMarkdown>

                ) : (

                  <p className="text-slate-500">
                    Job description not available.
                  </p>

                )}

              </div>

            </section>

            {/* =================================================
                REQUIRED SKILLS
            ================================================= */}

            <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <CheckCircle2
                    size={20}
                  />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Required Skills
                  </h2>

                  <p className="mt-0.5 text-sm text-slate-500">
                    Technical skills and tools mentioned in the job
                  </p>
                </div>

              </div>

              {skills.length > 0 ? (

                <div className="mt-5 flex flex-wrap gap-2.5">

                  {skills.map(
                    (
                      skill,
                      index
                    ) => (
                      <span
                        key={`${skill}-${index}`}
                        className="rounded-lg border border-blue-100 bg-blue-50 px-3.5 py-2 text-sm font-medium text-blue-700"
                      >
                        {cleanText(
                          skill
                        )}
                      </span>
                    )
                  )}

                </div>

              ) : (

                <p className="mt-4 text-slate-500">
                  Skills not mentioned.
                </p>

              )}

            </section>

            {/* =================================================
                RELATED ROLES
            ================================================= */}

            {roles.length > 0 && (

              <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                    <Briefcase
                      size={20}
                    />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Related Roles
                    </h2>

                    <p className="mt-0.5 text-sm text-slate-500">
                      Roles associated with this opportunity
                    </p>
                  </div>

                </div>

                <div className="mt-5 flex flex-wrap gap-2.5">

                  {roles.map(
                    (
                      role,
                      index
                    ) => (

                      <span
                        key={`${role}-${index}`}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-700"
                      >
                        {cleanText(
                          role
                        )}
                      </span>

                    )
                  )}

                </div>

              </section>

            )}

          </div>

          {/* ==================================================
              RIGHT SIDEBAR
          ================================================== */}

          <aside className="space-y-6">

            {/* =================================================
                JOB INFORMATION
            ================================================= */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <h2 className="text-lg font-bold text-slate-900">
                Job Information
              </h2>

              <div className="mt-5 divide-y divide-slate-100">

                {/* EMPLOYMENT */}

                <div className="py-4 first:pt-0">

                  <p className="text-sm text-slate-500">
                    Employment Type
                  </p>

                  <p className="mt-1 font-medium text-slate-800">
                    {cleanText(
                      job.employment_type
                    ) ||
                      "Not specified"}
                  </p>

                </div>

                {/* SCHEDULE */}

                <div className="py-4">

                  <p className="text-sm text-slate-500">
                    Work Schedule
                  </p>

                  <p className="mt-1 font-medium text-slate-800">
                    {cleanText(
                      job.schedule_type
                    ) ||
                      "Not specified"}
                  </p>

                </div>

                {/* EXPERIENCE */}

                <div className="py-4">

                  <p className="text-sm text-slate-500">
                    Experience
                  </p>

                  <p className="mt-1 font-medium text-slate-800">
                    {experience}
                  </p>

                </div>

                {/* LOCATION */}

                <div className="py-4">

                  <p className="text-sm text-slate-500">
                    Work Location
                  </p>

                  <p className="mt-1 font-medium text-slate-800">
                    {cleanText(
                      job.location
                    ) ||
                      cleanText(
                        job.location_requirement
                      ) ||
                      "Not specified"}
                  </p>

                </div>

                {/* LOCATION REQUIREMENT */}

                {job.location_requirement && (
                  <div className="py-4">

                    <p className="text-sm text-slate-500">
                      Location Requirement
                    </p>

                    <p className="mt-1 font-medium text-slate-800">
                      {cleanText(
                        job.location_requirement
                      )}
                    </p>

                  </div>
                )}

                {/* SOURCE */}

                <div className="py-4">

                  <p className="text-sm text-slate-500">
                    Source
                  </p>

                  <p className="mt-1 font-medium text-slate-800">
                    {cleanText(
                      job.source
                    ) ||
                      "Not specified"}
                  </p>

                </div>

                {/* POSTED */}

                <div className="py-4 last:pb-0">

                  <p className="flex items-center gap-2 text-sm text-slate-500">

                    <CalendarDays
                      size={15}
                    />

                    Posted

                  </p>

                  <p className="mt-1 font-medium text-slate-800">
                    {postedDate}
                  </p>

                </div>

              </div>

            </section>

            {/* =================================================
                SALARY
            ================================================= */}

            {(job.min_salary !==
              null ||
              job.max_salary !==
                null) && (

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex items-center gap-2">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">

                    <DollarSign
                      size={18}
                    />

                  </div>

                  <h2 className="text-lg font-bold text-slate-900">
                    Salary
                  </h2>

                </div>

                <p className="mt-4 text-lg font-semibold text-slate-800">

                  {job.min_salary !==
                    null &&
                    `₹${job.min_salary.toLocaleString(
                      "en-IN"
                    )}`}

                  {job.min_salary !==
                    null &&
                    job.max_salary !==
                      null &&
                    " - "}

                  {job.max_salary !==
                    null &&
                    `₹${job.max_salary.toLocaleString(
                      "en-IN"
                    )}`}

                </p>

              </section>

            )}

            {/* =================================================
                APPLY THROUGH
            ================================================= */}

            {applyOptions.length >
              0 && (

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <h2 className="text-lg font-bold text-slate-900">
                  Apply Through
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Choose an available application source.
                </p>

                <div className="mt-5 space-y-3">

                  {applyOptions.map(
                    (
                      option,
                      index
                    ) => (

                      <a
                        key={`${option.title}-${index}`}
                        href={
                          option.link
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-blue-300 hover:bg-blue-50"
                      >

                        <span className="font-medium text-slate-800">
                          {cleanText(
                            option.title
                          )}
                        </span>

                        <ExternalLink
                          size={17}
                          className="text-blue-600"
                        />

                      </a>

                    )
                  )}

                </div>

              </section>

            )}

            {/* =================================================
                QUICK APPLY
            ================================================= */}

            {primaryApplyUrl && (

              <section className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">

                <h2 className="text-lg font-bold">
                  Interested in this role?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Apply directly through the available job source.
                </p>

                <a
                  href={
                    primaryApplyUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Apply Now

                  <ExternalLink
                    size={17}
                  />
                </a>

              </section>

            )}

          </aside>

        </div>

        {/* ====================================================
            BOTTOM APPLY
        ==================================================== */}

        {primaryApplyUrl && (

          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              Interested in this opportunity?
            </h2>

            <p className="mt-2 text-slate-500">
              Apply through the available job source.
            </p>

            <a
              href={
                primaryApplyUrl
              }
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Apply for this Position

              <ExternalLink
                size={18}
              />
            </a>

          </section>

        )}

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <footer className="py-8 text-center text-sm text-slate-400">
          © 2026 CareerAI Job Board · AI-powered career intelligence
        </footer>

      </div>

    </main>
  );
}