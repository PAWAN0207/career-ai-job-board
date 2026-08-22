"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  Target,
  TrendingUp,
  UserRound,
  AlertCircle,
  Loader2,
  MapPin,
  Code2,
  GraduationCap,
  Sparkles,
  ArrowUpRight,
  CircleAlert,
} from "lucide-react";

/* ============================================================
   API
============================================================ */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

/* ============================================================
   TYPES
============================================================ */

type CareerProfile = {
  target_role?: string;
  experience_years?: number;
  experience_level?: string;
  skills?: string[];
  location?: string | null;
  work_mode?: string | null;
  match_score?: number;
};

type ProfileResponse = {
  status?: string;
  profile?: CareerProfile;
  message?: string;
};

type CareerInsight = {
  type?: string;
  title?: string;
  description?: string;
};

type InsightsResponse = {
  status?: string;
  source?: string;
  target_role?: string;
  experience_years?: number;
  skills_analyzed?: string[];
  overall_assessment?: string;
  total_insights?: number;
  insights?: CareerInsight[];
  recommended_skills?: string[];
  recommended_projects?: string[];
  action_plan?: string[];
  message?: string;
};

type CareerPathItem = {
  title?: string;
  level?: string;
};

type CareerPathResponse = {
  status?: string;
  source?: string;
  career_path?: CareerPathItem[];
  message?: string;
};

type RecommendedJob = {
  job_id?: string;
  title?: string;
  company_name?: string;
  location?: string;
  domain?: string;
  min_experience?: number | null;
  max_experience?: number | null;
  employment_type?: string | null;
  match_score?: number;
  matched_skills?: string[];
  skill_gaps?: string[];
  match_reasons?: string[];
  experience_status?: string;
  recommendation_type?: string;
  apply_url?: string | null;
};

type RecommendationsResponse = {
  status?: string;
  source?: string;
  target_role?: string;
  role_family?: string;
  user_experience?: number;
  user_skills?: string[];
  location?: string | null;
  work_mode?: string | null;
  total_recommendations?: number;
  recommendations?: RecommendedJob[];
  message?: string;
};

/* ============================================================
   HELPERS
============================================================ */

function cleanArray(
  values?: string[]
) {
  return Array.from(
    new Set(
      (values || [])
        .filter(Boolean)
        .map((value) =>
          String(value).trim()
        )
        .filter(Boolean)
    )
  );
}

function formatYears(
  value?: number
) {
  if (
    value === undefined ||
    value === null
  ) {
    return "0";
  }

  return Number.isInteger(value)
    ? value.toString()
    : value.toFixed(1);
}

function getScoreLabel(
  score: number
) {
  if (score >= 80) {
    return "Strong Match";
  }

  if (score >= 60) {
    return "Good Match";
  }

  if (score >= 40) {
    return "Developing Match";
  }

  return "Needs Improvement";
}

function getScoreClasses(
  score: number
) {
  if (score >= 80) {
    return {
      text: "text-green-600",
      ring: "border-green-100",
      bg: "bg-green-50",
    };
  }

  if (score >= 60) {
    return {
      text: "text-blue-600",
      ring: "border-blue-100",
      bg: "bg-blue-50",
    };
  }

  if (score >= 40) {
    return {
      text: "text-amber-600",
      ring: "border-amber-100",
      bg: "bg-amber-50",
    };
  }

  return {
    text: "text-red-600",
    ring: "border-red-100",
    bg: "bg-red-50",
  };
}

function getInsightStyle(
  type?: string
) {
  switch (
    (type || "").toLowerCase()
  ) {
    case "strength":
      return {
        icon: CheckCircle2,
        wrapper:
          "border-green-100 bg-green-50",
        iconColor:
          "text-green-600",
        title:
          "text-green-900",
      };

    case "gap":
      return {
        icon: CircleAlert,
        wrapper:
          "border-amber-100 bg-amber-50",
        iconColor:
          "text-amber-600",
        title:
          "text-amber-900",
      };

    default:
      return {
        icon: TrendingUp,
        wrapper:
          "border-blue-100 bg-blue-50",
        iconColor:
          "text-blue-600",
        title:
          "text-blue-900",
      };
  }
}

function formatRoleFamily(
  value?: string
) {
  if (!value) {
    return "";
  }

  return value
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase()
    );
}

/* ============================================================
   PAGE
============================================================ */

export default function CareerIntelligence() {
  /* ==========================================================
     STATE
  ========================================================== */

  const [profile, setProfile] =
    useState<CareerProfile | null>(
      null
    );

  const [insights, setInsights] =
    useState<InsightsResponse | null>(
      null
    );

  const [careerPath, setCareerPath] =
    useState<CareerPathItem[]>([]);

  const [recommendations, setRecommendations] =
    useState<RecommendedJob[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* ==========================================================
     LOAD DATA
  ========================================================== */

  useEffect(() => {
    let cancelled = false;

    async function loadCareerData() {
      try {
        setLoading(true);
        setError("");

        const results =
          await Promise.allSettled([
            fetch(
              `${API_URL}/api/career/profile`,
              {
                cache: "no-store",
              }
            ),
            fetch(
              `${API_URL}/api/career/insights`,
              {
                cache: "no-store",
              }
            ),
            fetch(
              `${API_URL}/api/career/career-path`,
              {
                cache: "no-store",
              }
            ),
            fetch(
              `${API_URL}/api/career/recommendations`,
              {
                cache: "no-store",
              }
            ),
          ]);

        if (cancelled) {
          return;
        }

        let profileData:
          | ProfileResponse
          | null = null;

        let insightsData:
          | InsightsResponse
          | null = null;

        let careerPathData:
          | CareerPathResponse
          | null = null;

        let recommendationsData:
          | RecommendationsResponse
          | null = null;

        /* ----------------------------------------------------
           PROFILE
        ---------------------------------------------------- */

        const profileResult =
          results[0];

        if (
          profileResult.status ===
          "fulfilled"
        ) {
          try {
            if (
              profileResult.value.ok
            ) {
              profileData =
                await profileResult.value.json();
            }
          } catch {
            profileData = null;
          }
        }

        /* ----------------------------------------------------
           INSIGHTS
        ---------------------------------------------------- */

        const insightsResult =
          results[1];

        if (
          insightsResult.status ===
          "fulfilled"
        ) {
          try {
            if (
              insightsResult.value.ok
            ) {
              insightsData =
                await insightsResult.value.json();
            }
          } catch {
            insightsData = null;
          }
        }

        /* ----------------------------------------------------
           CAREER PATH
        ---------------------------------------------------- */

        const careerPathResult =
          results[2];

        if (
          careerPathResult.status ===
          "fulfilled"
        ) {
          try {
            if (
              careerPathResult.value.ok
            ) {
              careerPathData =
                await careerPathResult.value.json();
            }
          } catch {
            careerPathData = null;
          }
        }

        /* ----------------------------------------------------
           RECOMMENDATIONS
        ---------------------------------------------------- */

        const recommendationsResult =
          results[3];

        if (
          recommendationsResult.status ===
          "fulfilled"
        ) {
          try {
            if (
              recommendationsResult.value
                .ok
            ) {
              recommendationsData =
                await recommendationsResult.value.json();
            }
          } catch {
            recommendationsData = null;
          }
        }

        const nextProfile =
          profileData?.profile || null;

        const nextInsights =
          insightsData || null;

        const nextCareerPath =
          careerPathData?.career_path ||
          [];

        const nextRecommendations =
          recommendationsData?.recommendations ||
          [];

        setProfile(
          nextProfile
        );

        setInsights(
          nextInsights
        );

        setCareerPath(
          nextCareerPath
        );

        setRecommendations(
          nextRecommendations
        );

        /*
         * Profile is the primary dependency.
         * If profile is unavailable, show an error.
         */
        if (!nextProfile) {
          throw new Error(
            "Career profile could not be loaded."
          );
        }
      } catch (err) {
        console.error(
          "Career Intelligence error:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load Career Intelligence."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCareerData();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="text-center">

          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">

            <Loader2
              className="h-6 w-6 animate-spin text-blue-600"
            />

          </div>

          <h2 className="text-lg font-semibold text-slate-900">
            Loading Career Intelligence
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Analyzing your career profile...
          </p>

        </div>

      </main>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (error || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">

        <div className="w-full max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">

            <AlertCircle
              className="h-6 w-6 text-red-600"
            />

          </div>

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            Career profile unavailable
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error ||
              "We could not load your current career profile."}
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">

            <Link
              href="/resume"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Sparkles size={17} />
              Analyze Resume
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft size={17} />
              Back to Jobs
            </Link>

          </div>

        </div>

      </main>
    );
  }

  /* ==========================================================
     DERIVED DATA
  ========================================================== */

  const skills =
    cleanArray(
      profile.skills
    );

  const matchScore =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(
          Number(
            profile.match_score ||
              0
          )
        )
      )
    );

  const scoreStyle =
    getScoreClasses(
      matchScore
    );

  const recommendedSkills =
    cleanArray(
      insights?.recommended_skills
    );

  const recommendedProjects =
    cleanArray(
      insights?.recommended_projects
    );

  const actionPlan =
    cleanArray(
      insights?.action_plan
    );

  const profileRole =
    profile.target_role ||
    "Not specified";

  const experienceYears =
    profile.experience_years ??
    0;

  const experienceLevel =
    profile.experience_level ||
    "Entry Level";

  const location =
    profile.location ||
    "Not specified";

  const workMode =
    profile.work_mode ||
    "Not specified";

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div className="flex items-center gap-6">

            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
            >
              <ArrowLeft
                className="h-4 w-4"
              />
              Back to Jobs
            </Link>

            <div className="hidden h-6 w-px bg-slate-200 sm:block" />

            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Career
                <span className="text-blue-600">
                  AI
                </span>
              </h1>

              <p className="text-xs text-slate-500">
                Career Intelligence
              </p>
            </div>

          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
            <UserRound className="h-5 w-5 text-blue-600" />
          </div>

        </div>

      </header>

      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="bg-white">

        <div className="mx-auto max-w-7xl px-6 py-12">

          <div className="max-w-4xl">

            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              <BrainCircuit className="h-4 w-4" />
              AI Career Intelligence
            </div>

            <h2 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">

              Understand your career.
              <span className="text-blue-600">
                {" "}Build your future.
              </span>

            </h2>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              Your career profile, skills,
              recommendations and development
              priorities — brought together in
              one intelligent view.
            </p>

          </div>

        </div>

      </section>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-8">

        {/* ====================================================
            PROFILE + MATCH SCORE
        ==================================================== */}

        <div className="grid gap-6 lg:grid-cols-3">

          {/* PROFILE */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

              <div>

                <div className="flex items-center gap-2">

                  <Target className="h-5 w-5 text-blue-600" />

                  <h3 className="text-xl font-bold">
                    Your Career Profile
                  </h3>

                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Current career preferences and
                  profile signals used by CareerAI.
                </p>

              </div>

              <span className="w-fit rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                Profile Active
              </span>

            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">

              {/* TARGET ROLE */}

              <div className="rounded-xl bg-slate-50 p-4">

                <div className="flex items-center gap-2">

                  <BriefcaseBusiness
                    className="h-4 w-4 text-blue-600"
                  />

                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Target Role
                  </p>

                </div>

                <p className="mt-2 font-semibold text-slate-900">
                  {profileRole}
                </p>

              </div>

              {/* EXPERIENCE */}

              <div className="rounded-xl bg-slate-50 p-4">

                <div className="flex items-center gap-2">

                  <TrendingUp
                    className="h-4 w-4 text-blue-600"
                  />

                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Experience
                  </p>

                </div>

                <p className="mt-2 font-semibold text-slate-900">
                  {formatYears(
                    experienceYears
                  )}{" "}
                  {experienceYears ===
                  1
                    ? "year"
                    : "years"}
                </p>

              </div>

              {/* CAREER LEVEL */}

              <div className="rounded-xl bg-slate-50 p-4">

                <div className="flex items-center gap-2">

                  <GraduationCap
                    className="h-4 w-4 text-blue-600"
                  />

                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Career Level
                  </p>

                </div>

                <p className="mt-2 font-semibold text-slate-900">
                  {experienceLevel}
                </p>

              </div>

              {/* LOCATION */}

              <div className="rounded-xl bg-slate-50 p-4">

                <div className="flex items-center gap-2">

                  <MapPin
                    className="h-4 w-4 text-blue-600"
                  />

                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Location
                  </p>

                </div>

                <p className="mt-2 font-semibold text-slate-900">
                  {location}
                </p>

              </div>

              {/* WORK MODE */}

              <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">

                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Preferred Work Mode
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {workMode}
                </p>

              </div>

              {/* SKILLS */}

              <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">

                <div className="flex items-center gap-2">

                  <Code2
                    className="h-4 w-4 text-blue-600"
                  />

                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Skills in Profile
                  </p>

                </div>

                {skills.length >
                0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">

                    {skills.map(
                      (
                        skill,
                        index
                      ) => (
                        <span
                          key={`${skill}-${index}`}
                          className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700"
                        >
                          {skill}
                        </span>
                      )
                    )}

                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    No skills available
                    in the current profile.
                  </p>
                )}

              </div>

            </div>

          </section>

          {/* MATCH SCORE */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-2">

              <TrendingUp className="h-5 w-5 text-blue-600" />

              <h3 className="text-lg font-bold">
                Career Match Score
              </h3>

            </div>

            <div className="mt-7 flex justify-center">

              <div
                className={`flex h-40 w-40 items-center justify-center rounded-full border-[12px] ${scoreStyle.ring}`}
              >

                <div className="text-center">

                  <p
                    className={`text-4xl font-bold ${scoreStyle.text}`}
                  >
                    {matchScore}%
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {getScoreLabel(
                      matchScore
                    )}
                  </p>

                </div>

              </div>

            </div>

            <div
              className={`mt-6 rounded-xl p-4 text-center ${scoreStyle.bg}`}
            >

              <p className="text-sm leading-6 text-slate-600">

                This score reflects how well
                your current career profile
                aligns with the target role
                and its expected skill set.

              </p>

            </div>

            <Link
              href="/?mode=matching"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Find Matching Jobs
              <ArrowUpRight size={16} />
            </Link>

          </section>

        </div>

        {/* ====================================================
            AI INSIGHTS
        ==================================================== */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-2">

            <Lightbulb className="h-5 w-5 text-blue-600" />

            <div>

              <h3 className="text-xl font-bold">
                AI Career Insights
              </h3>

              <p className="text-sm text-slate-500">
                Personalized analysis based on
                your current career profile.
              </p>

            </div>

          </div>

          {insights?.overall_assessment && (
            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">

              <div className="flex items-start gap-3">

                <Sparkles
                  className="mt-0.5 shrink-0 text-blue-600"
                  size={19}
                />

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    Overall Assessment
                  </p>

                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    {insights.overall_assessment}
                  </p>

                </div>

              </div>

            </div>
          )}

          {insights?.insights &&
            insights.insights.length >
              0 ? (

            <div className="mt-6 grid gap-4 md:grid-cols-3">

              {insights.insights
                .slice(0, 6)
                .map(
                  (
                    insight,
                    index
                  ) => {

                    const style =
                      getInsightStyle(
                        insight.type
                      );

                    const Icon =
                      style.icon;

                    return (
                      <div
                        key={`${insight.title}-${index}`}
                        className={`rounded-xl border p-5 ${style.wrapper}`}
                      >

                        <Icon
                          className={`h-5 w-5 ${style.iconColor}`}
                        />

                        <h4
                          className={`mt-3 font-semibold ${style.title}`}
                        >
                          {insight.title ||
                            "Career Insight"}
                        </h4>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {insight.description ||
                            "No additional details available."}
                        </p>

                      </div>
                    );
                  }
                )}

            </div>

          ) : (

            <div className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              No AI insights are currently available.
            </div>

          )}

        </section>

        {/* ====================================================
            DEVELOPMENT RECOMMENDATIONS
        ==================================================== */}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">

          {/* RECOMMENDED SKILLS */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-2">

              <Code2 className="h-5 w-5 text-blue-600" />

              <h3 className="text-lg font-bold">
                Recommended Skills
              </h3>

            </div>

            <p className="mt-1 text-sm text-slate-500">
              Skills that can improve your
              career readiness.
            </p>

            {recommendedSkills.length >
            0 ? (

              <div className="mt-5 space-y-2">

                {recommendedSkills.map(
                  (
                    skill,
                    index
                  ) => (
                    <div
                      key={`${skill}-${index}`}
                      className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
                    >

                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">

                        <TrendingUp
                          className="h-4 w-4 text-blue-600"
                        />

                      </div>

                      <span className="text-sm font-medium text-slate-700">
                        {skill}
                      </span>

                    </div>
                  )
                )}

              </div>

            ) : (

              <p className="mt-5 text-sm text-slate-500">
                No additional skills recommended
                at the moment.
              </p>

            )}

          </section>

          {/* PROJECTS */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-2">

              <BriefcaseBusiness className="h-5 w-5 text-blue-600" />

              <h3 className="text-lg font-bold">
                Recommended Projects
              </h3>

            </div>

            <p className="mt-1 text-sm text-slate-500">
              Practical projects to strengthen
              your portfolio.
            </p>

            {recommendedProjects.length >
            0 ? (

              <div className="mt-5 space-y-3">

                {recommendedProjects
                  .slice(0, 5)
                  .map(
                    (
                      project,
                      index
                    ) => (
                      <div
                        key={`${project}-${index}`}
                        className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                      >

                        <p className="text-sm font-medium leading-6 text-slate-700">
                          {project}
                        </p>

                      </div>
                    )
                  )}

              </div>

            ) : (

              <p className="mt-5 text-sm text-slate-500">
                No project recommendations
                are currently available.
              </p>

            )}

          </section>

          {/* ACTION PLAN */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-2">

              <Target className="h-5 w-5 text-blue-600" />

              <h3 className="text-lg font-bold">
                Action Plan
              </h3>

            </div>

            <p className="mt-1 text-sm text-slate-500">
              Practical next steps for your
              career development.
            </p>

            {actionPlan.length >
            0 ? (

              <div className="mt-5 space-y-3">

                {actionPlan
                  .slice(0, 5)
                  .map(
                    (
                      action,
                      index
                    ) => (
                      <div
                        key={`${action}-${index}`}
                        className="flex items-start gap-3 rounded-xl bg-slate-50 p-4"
                      >

                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                          {index + 1}
                        </div>

                        <p className="text-sm leading-6 text-slate-700">
                          {action}
                        </p>

                      </div>
                    )
                  )}

              </div>

            ) : (

              <p className="mt-5 text-sm text-slate-500">
                No action plan is currently available.
              </p>

            )}

          </section>

        </div>

        {/* ====================================================
            CAREER PATH
        ==================================================== */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-2">

            <Target className="h-5 w-5 text-blue-600" />

            <div>

              <h3 className="text-xl font-bold">
                Suggested Career Path
              </h3>

              <p className="text-sm text-slate-500">
                A possible progression based on
                your current career profile.
              </p>

            </div>

          </div>

          {careerPath.length >
          0 ? (

            <div className="mt-7 grid gap-4 md:grid-cols-4">

              {careerPath.map(
                (
                  role,
                  index
                ) => {

                  const isCurrent =
                    index === 0;

                  return (
                    <div
                      key={`${role.title}-${index}`}
                      className="relative"
                    >

                      <div
                        className={`rounded-xl border p-5 ${
                          isCurrent
                            ? "border-blue-200 bg-blue-50"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >

                        <BriefcaseBusiness
                          className={`h-5 w-5 ${
                            isCurrent
                              ? "text-blue-600"
                              : "text-slate-500"
                          }`}
                        />

                        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                          {role.level ||
                            "Career Step"}
                        </p>

                        <h4 className="mt-1 font-semibold text-slate-900">
                          {role.title ||
                            "Role"}
                        </h4>

                        {isCurrent && (
                          <span className="mt-3 inline-flex rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                            Current Focus
                          </span>
                        )}

                      </div>

                      {index <
                        careerPath.length -
                          1 && (
                        <ChevronRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-slate-300 md:block" />
                      )}

                    </div>
                  );
                }
              )}

            </div>

          ) : (

            <div className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              Career path is currently unavailable.
            </div>

          )}

        </section>

        {/* ====================================================
            RECOMMENDED JOBS
        ==================================================== */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <BriefcaseBusiness className="h-5 w-5 text-blue-600" />

                <h3 className="text-xl font-bold">
                  Recommended Jobs
                </h3>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                Opportunities ranked using your
                current CareerAI profile.
              </p>

            </div>

            <Link
              href="/?mode=matching"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              View All Matches
              <ArrowUpRight size={16} />
            </Link>

          </div>

          {recommendations.length >
          0 ? (

            <div className="mt-6 grid gap-4 md:grid-cols-2">

              {recommendations
                .slice(0, 6)
                .map(
                  (
                    job,
                    index
                  ) => {

                    const score =
                      Math.max(
                        0,
                        Math.min(
                          100,
                          Math.round(
                            Number(
                              job.match_score ||
                                0
                            )
                          )
                        )
                      );

                    return (
                      <div
                        key={
                          job.job_id ||
                          `${job.title}-${index}`
                        }
                        className="rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-200 hover:bg-blue-50/40"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">

                            <h4 className="truncate font-semibold text-slate-900">
                              {job.title ||
                                "Job Opportunity"}
                            </h4>

                            <p className="mt-1 text-sm text-slate-500">
                              {job.company_name ||
                                "Company not specified"}
                            </p>

                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                              score >=
                              75
                                ? "bg-green-100 text-green-700"
                                : score >=
                                  50
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {score}%
                          </span>

                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">

                          {job.location && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs text-slate-600">
                              <MapPin size={12} />
                              {job.location}
                            </span>
                          )}

                          {job.domain && (
                            <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600">
                              {job.domain}
                            </span>
                          )}

                          {job.experience_status && (
                            <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600">
                              {
                                job.experience_status
                              }
                            </span>
                          )}

                        </div>

                        {job.matched_skills &&
                          job.matched_skills
                            .length >
                            0 && (
                            <div className="mt-4">

                              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-green-600">
                                Matched Skills
                              </p>

                              <div className="flex flex-wrap gap-1.5">

                                {job.matched_skills
                                  .slice(
                                    0,
                                    5
                                  )
                                  .map(
                                    (
                                      skill,
                                      skillIndex
                                    ) => (
                                      <span
                                        key={`${skill}-${skillIndex}`}
                                        className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700"
                                      >
                                        {skill}
                                      </span>
                                    )
                                  )}

                              </div>

                            </div>
                          )}

                        <div className="mt-5 flex items-center justify-between gap-3">

                          <p className="text-xs text-slate-400">
                            {job.recommendation_type ||
                              "Recommended match"}
                          </p>

                          {job.job_id ? (
                            <Link
                              href={`/jobs/${encodeURIComponent(
                                job.job_id
                              )}`}
                              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                            >
                              View Details
                              <ChevronRight
                                size={16}
                              />
                            </Link>
                          ) : (
                            <Link
                              href="/?mode=matching"
                              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                            >
                              View Matches
                              <ChevronRight
                                size={16}
                              />
                            </Link>
                          )}

                        </div>

                      </div>
                    );
                  }
                )}

            </div>

          ) : (

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">

              <BriefcaseBusiness className="mx-auto h-8 w-8 text-slate-300" />

              <p className="mt-3 text-sm font-medium text-slate-700">
                No recommended jobs are currently available.
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Try updating your profile or analyzing your resume again.
              </p>

            </div>

          )}

        </section>

        {/* ====================================================
            FINAL CTA
        ==================================================== */}

        <section className="mt-6 rounded-2xl bg-slate-900 p-8 text-white">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <Sparkles
                  className="text-blue-400"
                  size={20}
                />

                <p className="text-sm font-semibold uppercase tracking-wide text-blue-400">
                  CareerAI
                </p>

              </div>

              <h3 className="mt-2 text-2xl font-bold">
                Ready to explore your next opportunity?
              </h3>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Use your current career profile to
                discover jobs ranked around your skills,
                role and experience.
              </p>

            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              <Link
                href="/resume"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Re-analyze Resume
              </Link>

              <Link
                href="/?mode=matching"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Find Matching Jobs
                <ArrowUpRight size={16} />
              </Link>

            </div>

          </div>

        </section>

      </section>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="mt-10 border-t border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-6 py-6 text-center text-sm text-slate-500">

          © 2026 CareerAI Job Board · AI-powered career intelligence

        </div>

      </footer>

    </main>
  );
}