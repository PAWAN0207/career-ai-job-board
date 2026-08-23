"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Search,
  MapPin,
  BriefcaseBusiness,
  Clock3,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Building2,
  SlidersHorizontal,
  FileText,
  Sparkles,
  Target,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  LogOut,
  UserRound,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { authenticatedFetch } from "@/lib/auth";

/* ============================================================
   TYPES
============================================================ */

type Job = {
  job_id: string;
  source: string;
  title: string;
  company_name: string;
  location: string;
  domain: string;
  roles: string;
  skills: string;

  min_experience: number | null;
  max_experience: number | null;

  employment_type: string | null;
  schedule_type: string | null;

  min_salary: number | null;
  max_salary: number | null;

  posted_at: string | null;
  apply_url: string | null;

  match_score?: number;
  matched_skills?: string[];
  skill_gaps?: string[];
  match_reasons?: string[];

  experience_score?: number;
  experience_status?: string;

  fresher_bonus?: number;
  recommendation_type?: string;

  location_match?: boolean;
  work_mode_match?: boolean;

  practical_score?: number;

  ai_explanation?: string;
};

type JobsResponse = {
  page?: number;
  limit?: number;
  count?: number;
  total?: number;
  jobs?: Job[];
};

type RecommendationsResponse = {
  status?: string;
  source?: string;

  user_id?: string;

  target_role?: string;
  role_family?: string;

  user_experience?: number;
  user_skills?: string[];

  location?: string | null;
  work_mode?: string | null;

  total_recommendations?: number;

  recommendations?: Job[];

  message?: string;
};

type AuthUser = {
  id?: string;
  email?: string;
  full_name?: string;
};

/* ============================================================
   API
============================================================ */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

/* ============================================================
   PAGE
============================================================ */

export default function Home() {
  /* ==========================================================
     JOB STATE
  ========================================================== */

  const [jobs, setJobs] =
    useState<Job[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [total, setTotal] =
    useState(0);

  /* ==========================================================
     FILTER STATE
  ========================================================== */

  const [search, setSearch] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [domain, setDomain] =
    useState("");

  const [employmentType, setEmploymentType] =
    useState("");

  const [source, setSource] =
    useState("");

  const [minExperience, setMinExperience] =
    useState("");

  const [maxExperience, setMaxExperience] =
    useState("");

  /* ==========================================================
     MATCHING STATE
  ========================================================== */

  const [isMatchingMode, setIsMatchingMode] =
    useState(false);

  // Prevent the initial job fetch from running before the URL mode
  // (?mode=matching) has been detected.
  const [modeInitialized, setModeInitialized] =
    useState(false);

  const [targetRole, setTargetRole] =
    useState("");

  const [userExperience, setUserExperience] =
    useState<number | null>(null);

  const [userSkills, setUserSkills] =
    useState<string[]>([]);

  /* ==========================================================
     AUTH STATE
  ========================================================== */

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  /* ==========================================================
     PAGINATION
  ========================================================== */

  const limit = 20;

  const totalPages = Math.max(
    1,
    Math.ceil(total / limit)
  );

  /* ==========================================================
     AUTH USER
  ========================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const {
          data,
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError) {
          console.warn(
            "Unable to get current user:",
            userError.message
          );
        }

        if (!mounted) {
          return;
        }

        if (data.user) {
          setUser({
            id: data.user.id,

            email:
              data.user.email ||
              undefined,

            full_name:
              data.user.user_metadata
                ?.full_name ||
              data.user.user_metadata
                ?.name ||
              undefined,
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error(
          "Auth check failed:",
          err
        );

        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    loadUser();

    const {
      data: authListener,
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!mounted) {
            return;
          }

          if (session?.user) {
            setUser({
              id: session.user.id,

              email:
                session.user.email ||
                undefined,

              full_name:
                session.user.user_metadata
                  ?.full_name ||
                session.user.user_metadata
                  ?.name ||
                undefined,
            });
          } else {
            setUser(null);
          }

          setAuthLoading(false);
        }
      );

    return () => {
      mounted = false;

      authListener.subscription.unsubscribe();
    };
  }, []);

  /* ==========================================================
     READ URL MODE
  ========================================================== */

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const matching =
      params.get("mode") ===
      "matching";

    setIsMatchingMode(
      matching
    );

    if (!matching) {
      setPage(1);
    }

    // URL mode has now been resolved.
    setModeInitialized(true);
  }, []);

  /* ==========================================================
     NORMAL JOB FETCH
  ========================================================== */

  async function fetchAllJobs() {
    try {
      setLoading(true);

      setError("");

      const params =
        new URLSearchParams();

      params.set(
        "page",
        page.toString()
      );

      params.set(
        "limit",
        limit.toString()
      );

      if (search.trim()) {
        params.set(
          "search",
          search.trim()
        );
      }

      if (location.trim()) {
        params.set(
          "location",
          location.trim()
        );
      }

      if (domain) {
        params.set(
          "domain",
          domain
        );
      }

      if (employmentType) {
        params.set(
          "employment_type",
          employmentType
        );
      }

      if (source) {
        params.set(
          "source",
          source
        );
      }

      if (minExperience) {
        params.set(
          "min_experience",
          minExperience
        );
      }

      if (maxExperience) {
        params.set(
          "max_experience",
          maxExperience
        );
      }

      const response =
        await fetch(
          `${API_URL}/api/jobs?${params.toString()}`,
          {
            cache:
              "no-store",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch jobs."
        );
      }

      const data: JobsResponse =
        await response.json();

      setJobs(
        data.jobs || []
      );

      setTotal(
        data.total || 0
      );
    } catch (err) {
      console.error(err);

      setJobs([]);

      setTotal(0);

      setError(
        "Unable to connect to the backend. Please make sure FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ==========================================================
     AUTHENTICATED MATCHING FETCH
  ========================================================== */

  async function fetchMatchingJobs() {
    try {
      setLoading(true);

      setError("");

      const response =
        await authenticatedFetch(
          `${API_URL}/api/career/recommendations`,
          {
            cache:
              "no-store",
          }
        );

      let data:
        RecommendationsResponse =
        {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {

        if (
          response.status ===
          401
        ) {
          throw new Error(
            "Please log in to view personalized job matches."
          );
        }

        throw new Error(
          data.message ||
          "Failed to load matching jobs."
        );
      }

      if (
        data.status &&
        data.status !==
          "success"
      ) {
        throw new Error(
          data.message ||
          "Unable to generate job recommendations."
        );
      }

      const recommendations =
        data.recommendations ||
        [];

      setJobs(
        recommendations
      );

      setTotal(
        data.total_recommendations ??
        recommendations.length
      );

      setTargetRole(
        data.target_role ||
        ""
      );

      setUserExperience(
        typeof data.user_experience ===
          "number"
          ? data.user_experience
          : null
      );

      setUserSkills(
        data.user_skills ||
        []
      );
    } catch (err) {
      console.error(
        "Matching jobs error:",
        err
      );

      setJobs([]);

      setTotal(0);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load matching jobs."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ==========================================================
     FETCH BASED ON MODE
  ========================================================== */

  useEffect(() => {
    // Do not fetch anything until the URL mode has been resolved.
    // This prevents /api/jobs from being called first when the page
    // was opened with ?mode=matching.
    if (!modeInitialized) {
      return;
    }

    if (isMatchingMode) {
      /*
       * Important:
       *
       * Matching endpoint is authenticated.
       *
       * When the auth state is still loading,
       * don't call it yet.
       */

      if (authLoading) {
        return;
      }

      fetchMatchingJobs();
      return;
    }

    fetchAllJobs();
  }, [
    modeInitialized,
    isMatchingMode,
    authLoading,
    page,
    search,
    location,
    domain,
    employmentType,
    source,
    minExperience,
    maxExperience,
  ]);

  /* ==========================================================
     CLEAR FILTERS
  ========================================================== */

  function clearFilters() {
    setSearch("");

    setLocation("");

    setDomain("");

    setEmploymentType("");

    setSource("");

    setMinExperience("");

    setMaxExperience("");

    setPage(1);
  }

  /* ==========================================================
     SWITCH TO ALL JOBS
  ========================================================== */

  function showAllJobs() {
    window.history.pushState(
      {},
      "",
      "/"
    );

    setIsMatchingMode(
      false
    );

    setPage(1);

    clearFilters();
  }

  /* ==========================================================
     SWITCH TO MATCHING JOBS
  ========================================================== */

  function showMatchingJobs() {
    window.history.pushState(
      {},
      "",
      "/?mode=matching"
    );

    setIsMatchingMode(
      true
    );

    setPage(1);
  }

  /* ==========================================================
     LOGOUT
  ========================================================== */

  async function handleLogout() {
    try {
      setAuthLoading(
        true
      );

      const {
        error: logoutError,
      } =
        await supabase.auth.signOut();

      if (logoutError) {
        throw logoutError;
      }

      setUser(null);

      window.location.href =
        "/";
    } catch (err) {
      console.error(
        "Logout failed:",
        err
      );

      setAuthLoading(
        false
      );

      setError(
        "Unable to log out. Please try again."
      );
    }
  }

  /* ==========================================================
     FORMAT EXPERIENCE
  ========================================================== */

  function formatExperience(
    job: Job
  ) {
    if (
      job.min_experience ===
        null &&
      job.max_experience ===
        null
    ) {
      return "Experience not specified";
    }

    if (
      job.min_experience !==
        null &&
      job.max_experience !==
        null
    ) {

      if (
        job.min_experience ===
        job.max_experience
      ) {

        return `${job.min_experience} years`;

      }

      return `${job.min_experience}-${job.max_experience} years`;
    }

    if (
      job.min_experience !==
      null
    ) {

      return `${job.min_experience}+ years`;
    }

    return `Up to ${job.max_experience} years`;
  }

  /* ==========================================================
     FORMAT POSTED DATE
  ========================================================== */

  function formatPostedDate(
    date: string | null
  ) {

    if (!date) {
      return "Recently posted";
    }

    const postedDate =
      new Date(date);

    if (
      Number.isNaN(
        postedDate.getTime()
      )
    ) {
      return "Recently posted";
    }

    return postedDate.toLocaleDateString(
      "en-IN",
      {
        day:
          "numeric",

        month:
          "short",

        year:
          "numeric",
      }
    );
  }

  /* ==========================================================
     MATCH SCORE
  ========================================================== */

  function getMatchScore(
    job: Job
  ) {

    return Math.max(
      0,
      Math.min(
        100,
        Math.round(
          job.match_score ||
          0
        )
      )
    );
  }

  /* ==========================================================
     DISPLAY NAME
  ========================================================== */

  const displayName =
    user?.full_name ||
    user?.email ||
    "Account";

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          {/* LOGO */}

          <Link
            href="/"
            className="block"
          >

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">

              Career

              <span className="text-blue-600">
                AI
              </span>

            </h1>

            <p className="text-sm text-slate-500">
              AI-powered job discovery
            </p>

          </Link>

          {/* NAVIGATION */}

          <nav className="flex items-center gap-2 text-sm font-medium">

            {/* FIND JOBS */}

            <button
              type="button"
              onClick={
                showAllJobs
              }
              className={`hidden rounded-lg px-3 py-2 transition md:block ${
                !isMatchingMode
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
              }`}
            >
              Find Jobs
            </button>

            {/* CAREER INTELLIGENCE */}

            <Link
              href="/career-intelligence"
              className="hidden rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-50 hover:text-blue-600 md:block"
            >
              Career Intelligence
            </Link>

            {/* CAREER ASSISTANT */}

            <Link
              href="/career-assistant"
              className="hidden items-center gap-2 rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-50 hover:text-blue-600 md:flex"
            >

              <MessageCircle
                className="h-4 w-4"
              />

              Career Assistant

            </Link>

            {/* MOBILE CAREER ASSISTANT */}

            <Link
              href="/career-assistant"
              aria-label="Career Assistant"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-blue-50 hover:text-blue-600 md:hidden"
            >

              <MessageCircle
                className="h-4 w-4"
              />

            </Link>

            {/* RESUME */}

            <Link
              href="/resume"
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
            >

              <FileText
                className="h-4 w-4"
              />

              <span className="hidden sm:inline">
                Analyze Resume
              </span>

            </Link>

            {/* AUTH */}

            {!authLoading &&
              (
                user ? (
                  <div className="ml-1 flex items-center gap-2">

                    {/* USER */}

                    <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 lg:flex">

                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50">

                        <UserRound
                          size={14}
                          className="text-blue-600"
                        />

                      </div>

                      <div className="max-w-[150px]">

                        <p className="truncate text-xs font-semibold text-slate-800">
                          {displayName}
                        </p>

                        {user.email &&
                          user.full_name && (
                            <p className="truncate text-[10px] text-slate-400">
                              {user.email}
                            </p>
                          )}

                      </div>

                    </div>

                    {/* LOGOUT */}

                    <button
                      type="button"
                      onClick={
                        handleLogout
                      }
                      className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >

                      <LogOut
                        size={15}
                      />

                      <span className="hidden sm:inline">
                        Logout
                      </span>

                    </button>

                  </div>
                ) : (
                  <div className="flex items-center gap-2">

                    <Link
                      href="/login"
                      className="hidden rounded-lg border border-slate-200 px-3 py-2 text-slate-700 transition hover:bg-slate-50 sm:block"
                    >
                      Log In
                    </Link>

                    <Link
                      href="/signup"
                      className="rounded-lg bg-slate-900 px-3 py-2 text-white transition hover:bg-slate-800"
                    >
                      Sign Up
                    </Link>

                  </div>
                )
              )}

          </nav>

        </div>

      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="bg-white">

        <div className="mx-auto max-w-7xl px-6 pb-10 pt-12">

          <div className="max-w-3xl">

            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600">

              {isMatchingMode
                ? "AI Career Matching"
                : "Smart Job Search"}

            </p>

            <h2 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">

              {isMatchingMode ? (
                <>
                  Jobs that match your

                  <span className="text-blue-600">
                    {" "}profile.
                  </span>
                </>
              ) : (
                <>
                  Find your next

                  <span className="text-blue-600">
                    {" "}opportunity.
                  </span>
                </>
              )}

            </h2>

            <p className="mt-4 text-lg text-slate-600">

              {isMatchingMode ? (
                <>
                  CareerAI ranked these opportunities
                  using your skills, experience,
                  target role and career profile.
                </>
              ) : (
                <>
                  Search thousands of jobs and find
                  opportunities that match your skills,
                  experience and career goals.
                </>
              )}

            </p>

          </div>

          {/* QUICK ACTIONS */}

          <div className="mt-7 flex flex-wrap gap-3">

            <Link
              href="/career-assistant"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
            >

              <Sparkles
                size={16}
              />

              Ask CareerAI

            </Link>

            <Link
              href="/career-intelligence"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >

              <Target
                size={16}
              />

              Career Intelligence

            </Link>

            {!isMatchingMode && (
              <button
                type="button"
                onClick={
                  showMatchingJobs
                }
                className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-100"
              >

                <Sparkles
                  size={16}
                />

                Find Matching Jobs

              </button>
            )}

          </div>

          {/* =================================================
              MATCHING PROFILE SUMMARY
          ================================================= */}

          {isMatchingMode && (
            <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5">

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div className="flex items-start gap-3">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">

                    <Sparkles
                      size={21}
                    />

                  </div>

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                      Matching Profile
                    </p>

                    <h3 className="mt-1 font-bold text-slate-900">
                      {targetRole ||
                        "Your Career Profile"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-600">

                      {userExperience !==
                        null &&
                        `${userExperience} years experience`}

                      {userExperience !==
                        null &&
                        userSkills.length >
                          0 &&
                        " · "}

                      {userSkills.length >
                        0 &&
                        `${userSkills.length} skills analyzed`}

                    </p>

                  </div>

                </div>

                <div className="flex flex-wrap gap-2">

                  <Link
                    href="/career-assistant"
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                  >

                    <MessageCircle
                      size={16}
                    />

                    Ask CareerAI

                  </Link>

                  <button
                    type="button"
                    onClick={
                      showAllJobs
                    }
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Browse All Jobs
                  </button>

                </div>

              </div>

            </div>
          )}

          {/* =================================================
              NORMAL SEARCH
          ================================================= */}

          {!isMatchingMode && (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">

              <div className="flex flex-col gap-3 lg:flex-row">

                <div className="flex flex-1 items-center rounded-xl bg-slate-50 px-4">

                  <Search
                    className="mr-3 h-5 w-5 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(
                        e.target.value
                      );

                      setPage(1);
                    }}
                    placeholder="Search jobs, skills or companies..."
                    className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-400"
                  />

                </div>

                <div className="flex flex-1 items-center rounded-xl bg-slate-50 px-4">

                  <MapPin
                    className="mr-3 h-5 w-5 text-slate-400"
                  />

                  <input
                    value={location}
                    onChange={(e) => {
                      setLocation(
                        e.target.value
                      );

                      setPage(1);
                    }}
                    placeholder="Location"
                    className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-400"
                  />

                </div>

                <button
                  type="button"
                  onClick={() => {

                    setPage(1);

                    fetchAllJobs();

                  }}
                  className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Search Jobs
                </button>

              </div>

            </div>
          )}

        </div>

      </section>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-8">

        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">

          {/* =================================================
              SIDEBAR
          ================================================= */}

          {!isMatchingMode ? (

            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="mb-6 flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <SlidersHorizontal
                    className="h-5 w-5 text-slate-600"
                  />

                  <h3 className="font-semibold">
                    Filters
                  </h3>

                </div>

                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Clear
                </button>

              </div>

              {/* DOMAIN */}

              <div className="mb-6">

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Domain
                </label>

                <select
                  value={domain}
                  onChange={(e) => {

                    setDomain(
                      e.target.value
                    );

                    setPage(1);

                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >

                  <option value="">
                    All domains
                  </option>

                  <option value="Data Science">
                    Data Science
                  </option>

                  <option value="Web Development">
                    Web Development
                  </option>

                </select>

              </div>

              {/* EMPLOYMENT TYPE */}

              <div className="mb-6">

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Employment Type
                </label>

                <select
                  value={
                    employmentType
                  }
                  onChange={(e) => {

                    setEmploymentType(
                      e.target.value
                    );

                    setPage(1);

                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >

                  <option value="">
                    All types
                  </option>

                  <option value="Permanent">
                    Permanent
                  </option>

                  <option value="Internship">
                    Internship
                  </option>

                  <option value="Contract">
                    Contract
                  </option>

                </select>

              </div>

              {/* JOB SOURCE */}

              <div className="mb-6">

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Job Source
                </label>

                <select
                  value={source}
                  onChange={(e) => {

                    setSource(
                      e.target.value
                    );

                    setPage(1);

                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >

                  <option value="">
                    All sources
                  </option>

                  <option value="LinkedIn">
                    LinkedIn
                  </option>

                  <option value="Indeed">
                    Indeed
                  </option>

                  <option value="Internshala">
                    Internshala
                  </option>

                  <option value="Naukri">
                    Naukri
                  </option>

                  <option value="Glassdoor">
                    Glassdoor
                  </option>

                  <option value="Foundit.in">
                    Foundit.in
                  </option>

                  <option value="Wellfound">
                    Wellfound
                  </option>

                  <option value="Shine">
                    Shine
                  </option>

                  <option value="Cutshort">
                    Cutshort
                  </option>

                </select>

              </div>

              {/* EXPERIENCE */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Experience
                </label>

                <div className="grid grid-cols-2 gap-2">

                  <input
                    type="number"
                    min="0"
                    value={
                      minExperience
                    }
                    onChange={(e) => {

                      setMinExperience(
                        e.target.value
                      );

                      setPage(1);

                    }}
                    placeholder="Min"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />

                  <input
                    type="number"
                    min="0"
                    value={
                      maxExperience
                    }
                    onChange={(e) => {

                      setMaxExperience(
                        e.target.value
                      );

                      setPage(1);

                    }}
                    placeholder="Max"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />

                </div>

              </div>

              {/* ASSISTANT CTA */}

              <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">

                <div className="flex items-center gap-2">

                  <MessageCircle
                    size={17}
                    className="text-blue-600"
                  />

                  <p className="text-sm font-semibold text-blue-900">
                    Need career guidance?
                  </p>

                </div>

                <p className="mt-2 text-xs leading-5 text-blue-800">
                  Ask CareerAI about skills,
                  career direction and job readiness.
                </p>

                <Link
                  href="/career-assistant"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
                >

                  Open Career Assistant

                  <ChevronRight
                    size={14}
                  />

                </Link>

              </div>

            </aside>

          ) : (

            <aside className="h-fit rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">

              <div className="flex items-center gap-2">

                <Target
                  className="h-5 w-5 text-blue-600"
                />

                <h3 className="font-semibold">
                  Matching Engine
                </h3>

              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Jobs are ranked using your
                saved CareerAI profile, target
                role, skills and experience.
              </p>

              {targetRole && (
                <div className="mt-5 rounded-xl bg-blue-50 p-4">

                  <p className="text-xs font-medium text-blue-600">
                    Target Role
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {targetRole}
                  </p>

                </div>
              )}

              {userExperience !==
                null && (
                <div className="mt-4 rounded-xl bg-slate-50 p-4">

                  <p className="text-xs font-medium text-slate-500">
                    Experience
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {userExperience} years
                  </p>

                </div>
              )}

              {userSkills.length >
                0 && (
                <div className="mt-4">

                  <p className="mb-2 text-xs font-medium text-slate-500">
                    Skills analyzed
                  </p>

                  <div className="flex flex-wrap gap-1.5">

                    {userSkills
                      .slice(
                        0,
                        10
                      )
                      .map(
                        (
                          skill,
                          index
                        ) => (

                          <span
                            key={`${skill}-${index}`}
                            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                          >
                            {skill}
                          </span>

                        )
                      )}

                  </div>

                  {userSkills.length >
                    10 && (
                    <p className="mt-2 text-xs text-slate-400">

                      +
                      {userSkills.length -
                        10}{" "}
                      more

                    </p>
                  )}

                </div>
              )}

              <Link
                href="/career-assistant"
                className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >

                <MessageCircle
                  size={16}
                />

                Ask CareerAI

              </Link>

            </aside>

          )}

          {/* =================================================
              JOB LIST
          ================================================= */}

          <div>

            {/* LIST HEADER */}

            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <div className="flex items-center gap-2">

                  <h3 className="text-xl font-bold">

                    {isMatchingMode
                      ? "Recommended Jobs"
                      : "Latest Opportunities"}

                  </h3>

                  {isMatchingMode && (
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      AI Matched
                    </span>
                  )}

                </div>

                <p className="mt-1 text-sm text-slate-500">

                  {total.toLocaleString(
                    "en-IN"
                  )}{" "}

                  {isMatchingMode
                    ? "matching jobs"
                    : "jobs available"}

                </p>

              </div>

              {!isMatchingMode && (
                <div className="hidden rounded-lg bg-white px-3 py-2 text-sm text-slate-500 shadow-sm sm:block">

                  Page {page} of{" "}

                  {totalPages.toLocaleString(
                    "en-IN"
                  )}

                </div>
              )}

            </div>

            {/* ERROR */}

            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                <AlertCircle
                  className="mt-0.5 shrink-0"
                  size={18}
                />

                <div>

                  <p className="font-medium">
                    Unable to load jobs
                  </p>

                  <p className="mt-1">
                    {error}
                  </p>

                  {isMatchingMode &&
                    error.toLowerCase().includes(
                      "log in"
                    ) && (
                      <Link
                        href="/login"
                        className="mt-3 inline-block rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        Log In
                      </Link>
                    )}

                </div>

              </div>
            )}

            {/* MATCHING SUCCESS INFO */}

            {isMatchingMode &&
              !loading &&
              !error &&
              jobs.length > 0 && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">

                  <CheckCircle2
                    size={19}
                    className="mt-0.5 shrink-0 text-green-600"
                  />

                  <div>

                    <p className="text-sm font-semibold text-green-800">
                      Personalized matches found
                    </p>

                    <p className="mt-1 text-xs leading-5 text-green-700">
                      These jobs are ranked using
                      your saved CareerAI profile.
                      Higher match scores indicate
                      stronger alignment.
                    </p>

                  </div>

                </div>
              )}

            {/* LOADING */}

            {loading && (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                <p className="text-sm text-slate-500">

                  {isMatchingMode
                    ? "Finding jobs that match your profile..."
                    : "Finding opportunities..."}

                </p>

              </div>
            )}

            {/* JOBS */}

            {!loading &&
              jobs.length > 0 && (
                <div className="space-y-4">

                  {jobs.map(
                    (job) => {

                      const score =
                        getMatchScore(
                          job
                        );

                      return (
                        <article
                          key={
                            job.job_id
                          }
                          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                        >

                          <div className="flex flex-col justify-between gap-5 sm:flex-row">

                            <div className="flex-1">

                              {/* TITLE */}

                              <div className="mb-2 flex items-start gap-3">

                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">

                                  <Building2
                                    className="h-5 w-5 text-blue-600"
                                  />

                                </div>

                                <div className="min-w-0">

                                  <h4 className="text-lg font-semibold text-slate-900">
                                    {job.title}
                                  </h4>

                                  <p className="text-sm font-medium text-slate-600">
                                    {job.company_name}
                                  </p>

                                </div>

                              </div>

                              {/* MATCH SCORE */}

                              {isMatchingMode && (
                                <div className="mb-4 mt-4 flex flex-wrap items-center gap-2">

                                  <span
                                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                                      score >=
                                      75
                                        ? "bg-green-100 text-green-700"
                                        : score >=
                                          50
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-amber-100 text-amber-700"
                                    }`}
                                  >

                                    <Sparkles
                                      size={13}
                                    />

                                    {score}% Match

                                  </span>

                                  {job.recommendation_type && (
                                    <span className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700">

                                      {
                                        job.recommendation_type
                                      }

                                    </span>
                                  )}

                                </div>
                              )}

                              {/* META */}

                              <div className="mt-4 flex flex-wrap gap-2 text-xs">

                                <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">

                                  <MapPin
                                    className="h-3.5 w-3.5"
                                  />

                                  {job.location ||
                                    "Location not specified"}

                                </span>

                                <span className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">

                                  <BriefcaseBusiness
                                    className="h-3.5 w-3.5"
                                  />

                                  {job.domain ||
                                    "General"}

                                </span>

                                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">

                                  {formatExperience(
                                    job
                                  )}

                                </span>

                                {job.employment_type && (
                                  <span className="rounded-full bg-green-50 px-3 py-1.5 text-green-700">

                                    {
                                      job.employment_type
                                    }

                                  </span>
                                )}

                              </div>

                              {/* MATCH REASONS */}

                              {isMatchingMode &&
                                job.match_reasons &&
                                job.match_reasons
                                  .length >
                                  0 && (
                                  <div className="mt-4 flex flex-wrap gap-2">

                                    {job.match_reasons
                                      .slice(
                                        0,
                                        4
                                      )
                                      .map(
                                        (
                                          reason,
                                          index
                                        ) => (

                                          <span
                                            key={`${reason}-${index}`}
                                            className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700"
                                          >
                                            ✓{" "}
                                            {reason}
                                          </span>

                                        )
                                      )}

                                  </div>
                                )}

                              {/* SKILLS */}

                              {job.skills && (
                                <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">

                                  <span className="font-medium text-slate-700">
                                    Skills:
                                  </span>{" "}

                                  {job.skills}

                                </p>
                              )}

                              {/* MATCHED SKILLS */}

                              {isMatchingMode &&
                                job.matched_skills &&
                                job.matched_skills
                                  .length >
                                  0 && (
                                  <div className="mt-4">

                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-600">
                                      Matched Skills
                                    </p>

                                    <div className="flex flex-wrap gap-2">

                                      {job.matched_skills
                                        .slice(
                                          0,
                                          8
                                        )
                                        .map(
                                          (
                                            skill,
                                            index
                                          ) => (

                                            <span
                                              key={`${skill}-${index}`}
                                              className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700"
                                            >
                                              {skill}
                                            </span>

                                          )
                                        )}

                                    </div>

                                  </div>
                                )}

                              {/* SKILL GAPS */}

                              {isMatchingMode &&
                                job.skill_gaps &&
                                job.skill_gaps
                                  .length >
                                  0 && (
                                  <div className="mt-4">

                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-600">
                                      Skill Gaps
                                    </p>

                                    <div className="flex flex-wrap gap-2">

                                      {job.skill_gaps
                                        .slice(
                                          0,
                                          5
                                        )
                                        .map(
                                          (
                                            skill,
                                            index
                                          ) => (

                                            <span
                                              key={`${skill}-${index}`}
                                              className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
                                            >
                                              {skill}
                                            </span>

                                          )
                                        )}

                                    </div>

                                  </div>
                                )}

                              {/* EXPERIENCE STATUS */}

                              {isMatchingMode &&
                                job.experience_status && (
                                  <div className="mt-4 flex items-center gap-2 text-xs">

                                    <BriefcaseBusiness
                                      size={14}
                                      className="text-slate-400"
                                    />

                                    <span className="font-medium text-slate-600">
                                      Experience:
                                    </span>

                                    <span
                                      className={
                                        job.experience_status ===
                                          "Excellent Match" ||
                                        job.experience_status ===
                                          "Good Match"
                                          ? "font-semibold text-green-600"
                                          : job.experience_status ===
                                            "Close Match"
                                          ? "font-semibold text-blue-600"
                                          : "text-slate-500"
                                      }
                                    >
                                      {
                                        job.experience_status
                                      }
                                    </span>

                                  </div>
                                )}

                              {/* AI EXPLANATION */}

                              {isMatchingMode &&
                                job.ai_explanation && (
                                  <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3">

                                    <p className="text-xs leading-5 text-blue-800">
                                      {
                                        job.ai_explanation
                                      }
                                    </p>

                                  </div>
                                )}

                              {/* POSTED DATE */}

                              <div className="mt-4 flex items-center gap-1 text-xs text-slate-400">

                                <Clock3
                                  className="h-3.5 w-3.5"
                                />

                                Posted{" "}

                                {formatPostedDate(
                                  job.posted_at
                                )}

                              </div>

                            </div>

                            {/* ACTIONS */}

                            <div className="flex shrink-0 flex-col items-stretch justify-center gap-2 sm:items-end">

                              <Link
                                href={`/jobs/${encodeURIComponent(
                                  job.job_id
                                )}`}
                                className="flex items-center justify-center rounded-xl border border-blue-600 bg-white px-5 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                              >
                                View Details
                              </Link>

                              {job.apply_url ? (
                                <a
                                  href={
                                    job.apply_url
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                                >

                                  Apply

                                  <ExternalLink className="h-4 w-4" />

                                </a>
                              ) : (
                                <span className="rounded-xl bg-slate-100 px-5 py-3 text-center text-sm font-medium text-slate-400">
                                  Apply unavailable
                                </span>
                              )}

                            </div>

                          </div>

                        </article>
                      );
                    }
                  )}

                </div>
              )}

            {/* NO JOBS */}

            {!loading &&
              jobs.length === 0 &&
              !error && (

                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">

                  <Search
                    className="mx-auto mb-4 h-10 w-10 text-slate-300"
                  />

                  <h3 className="font-semibold text-slate-800">

                    {isMatchingMode
                      ? "No matching jobs found"
                      : "No jobs found"}

                  </h3>

                  <p className="mt-1 text-sm text-slate-500">

                    {isMatchingMode
                      ? "Your current saved profile did not produce matching opportunities."
                      : "Try changing your search or filters."}

                  </p>

                  {isMatchingMode ? (

                    <div className="mt-5 flex justify-center gap-2">

                      <button
                        type="button"
                        onClick={
                          showAllJobs
                        }
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                      >
                        Browse All Jobs
                      </button>

                      <Link
                        href="/resume"
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Update Resume
                      </Link>

                    </div>

                  ) : (

                    <button
                      type="button"
                      onClick={
                        clearFilters
                      }
                      className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                    >
                      Clear filters
                    </button>

                  )}

                </div>
              )}

            {/* PAGINATION */}

            {!loading &&
              jobs.length > 0 &&
              !isMatchingMode && (

                <div className="mt-8 flex items-center justify-center gap-3">

                  <button
                    type="button"
                    disabled={
                      page === 1
                    }
                    onClick={() =>
                      setPage(
                        (p) =>
                          Math.max(
                            1,
                            p - 1
                          )
                      )
                    }
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >

                    <ChevronLeft
                      className="h-4 w-4"
                    />

                    Previous

                  </button>

                  <span className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
                    {page}
                  </span>

                  <button
                    type="button"
                    disabled={
                      page >=
                      totalPages
                    }
                    onClick={() =>
                      setPage(
                        (p) =>
                          p + 1
                      )
                    }
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >

                    Next

                    <ChevronRight
                      className="h-4 w-4"
                    />

                  </button>

                </div>
              )}

            {/* MATCHING FOOTER */}

            {isMatchingMode &&
              !loading &&
              jobs.length > 0 && (

                <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 text-center">

                  <p className="text-xs text-slate-500">

                    Showing the top{" "}
                    {jobs.length}{" "}
                    recommendations generated
                    from your saved CareerAI profile.

                  </p>

                  <Link
                    href="/career-assistant"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >

                    Have questions about your matches?

                    <MessageCircle
                      size={13}
                    />

                  </Link>

                </div>
              )}

          </div>
        </div>

      </section>

      {/* =====================================================
          CAREER ASSISTANT CTA
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-6 pb-8">

        <div className="rounded-2xl bg-slate-900 p-7 text-white">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <Sparkles
                  size={18}
                  className="text-blue-400"
                />

                <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">
                  CareerAI Assistant
                </p>

              </div>

              <h3 className="mt-2 text-2xl font-bold">
                Need help choosing your next step?
              </h3>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Ask CareerAI about your skills,
                career path, job readiness and
                opportunities matching your profile.
              </p>

            </div>

            <Link
              href="/career-assistant"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >

              <MessageCircle
                size={17}
              />

              Ask CareerAI

              <ChevronRight
                size={17}
              />

            </Link>

          </div>

        </div>

      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="mt-2 border-t border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-6 py-6 text-center text-sm text-slate-500">
          © 2026 CareerAI Job Board · Smart career discovery powered by data
        </div>

      </footer>

    </main>
  );
}