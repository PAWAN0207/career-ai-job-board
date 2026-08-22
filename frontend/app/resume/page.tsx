"use client";

import {
  ChangeEvent,
  DragEvent,
  useState,
} from "react";

import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Briefcase,
  Code2,
  GraduationCap,
  ArrowRight,
  Search,
  MapPin,
  Mail,
  Phone,
  Award,
  FolderKanban,
  MessageCircle,
} from "lucide-react";

import Link from "next/link";

import {
  authenticatedFetch,
  getCurrentUser,
} from "@/lib/auth";

/* ============================================================
   API
============================================================ */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

/* ============================================================
   TYPES
============================================================ */

type Candidate = {
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
};

type Skills = {
  programming?: string[];
  data_analysis?: string[];
  machine_learning?: string[];
  visualization?: string[];
  deployment?: string[];
  other?: string[];
};

type ExperiencePosition = {
  title: string | null;
  organization: string | null;
  duration: string | null;
  type: string | null;
  description: string | null;
};

type Experience = {
  total_years?: number;
  technical_years?: number;
  positions?: ExperiencePosition[];
};

type Education = {
  degree: string | null;
  institution: string | null;
  status: string | null;
  year: string | null;
};

type Project = {
  name: string | null;
  description: string | null;
  technologies?: string[];
  impact: string | null;
};

type ResumeProfile = {
  candidate?: Candidate;
  professional_summary?: string | null;
  experience?: Experience;
  skills?: Skills;
  education?: Education[];
  projects?: Project[];
  achievements?: string[];
  recommended_roles?: string[];
  career_level?: string | null;
  resume_id?: string | null;
  filename?: string | null;
};

type UploadResponse = {
  status: string;
  message?: string;
  resume_id?: string;
  filename?: string;
  file_type?: string;
  file_size?: number;
  stored_filename?: string;
  text_length?: number;
  resume_text?: string;
  candidate_profile?: ResumeProfile;
  profile_source?: string;
  ai_error?: string | null;
};

type CareerSyncResponse = {
  status?: string;
  message?: string;
  profile?: {
    target_role?: string;
    role_family?: string;
    experience_years?: number;
    experience_level?: string;
    skills?: string[];
    location?: string | null;
    work_mode?: string | null;
    match_score?: number;
  };
  recommended_roles?: string[];
  persisted?: boolean;
  user?: {
    user_id?: string;
    email?: string | null;
  };
  error?: string;
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
          value.trim()
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

/* ============================================================
   PAGE
============================================================ */

export default function ResumePage() {
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [result, setResult] =
    useState<UploadResponse | null>(
      null
    );

  const [dragActive, setDragActive] =
    useState(false);

  const [careerSyncStatus, setCareerSyncStatus] =
    useState<
      "idle" |
      "syncing" |
      "success" |
      "failed"
    >("idle");

  const [loggedInUser, setLoggedInUser] =
    useState<{
      email?: string;
      id?: string;
    } | null>(null);

  /* ==========================================================
     LOAD CURRENT USER
  ========================================================== */

  async function loadCurrentUser() {
    try {
      const user =
        await getCurrentUser();

      if (user) {
        setLoggedInUser({
          id: user.id,
          email:
            user.email ||
            undefined,
        });
      } else {
        setLoggedInUser(null);
      }
    } catch (err) {
      console.warn(
        "Unable to load current user:",
        err
      );

      setLoggedInUser(null);
    }
  }

  /* ==========================================================
     FILE VALIDATION
  ========================================================== */

  function validateAndSetFile(
    file: File
  ) {
    setError("");
    setResult(null);
    setCareerSyncStatus(
      "idle"
    );

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    const allowedExtensions = [
      ".pdf",
      ".docx",
      ".txt",
    ];

    const maxSize =
      5 * 1024 * 1024;

    const extension =
      file.name
        .substring(
          file.name.lastIndexOf(".")
        )
        .toLowerCase();

    const validType =
      allowedTypes.includes(
        file.type
      ) ||
      allowedExtensions.includes(
        extension
      );

    if (!validType) {
      setError(
        "Please upload a PDF, DOCX, or TXT resume."
      );

      setSelectedFile(null);

      return;
    }

    if (file.size > maxSize) {
      setError(
        "Resume size must be less than 5 MB."
      );

      setSelectedFile(null);

      return;
    }

    setSelectedFile(file);

    loadCurrentUser();
  }

  /* ==========================================================
     FILE INPUT
  ========================================================== */

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    validateAndSetFile(file);
  }

  /* ==========================================================
     DRAG OVER
  ========================================================== */

  function handleDragOver(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    setDragActive(true);
  }

  /* ==========================================================
     DRAG LEAVE
  ========================================================== */

  function handleDragLeave(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    setDragActive(false);
  }

  /* ==========================================================
     DROP
  ========================================================== */

  function handleDrop(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    setDragActive(false);

    const file =
      event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    validateAndSetFile(file);
  }

  /* ==========================================================
     RESUME → CAREER PROFILE SYNC
  ========================================================== */

  async function syncCareerProfile(
    resumeProfile: ResumeProfile,
    uploadData: UploadResponse
  ) {
    setCareerSyncStatus(
      "syncing"
    );

    try {
      /*
       * Backend /api/career/profile/from-resume
       * is now protected and requires:
       *
       * Authorization: Bearer <supabase_access_token>
       *
       * authenticatedFetch() gets the current
       * Supabase session token automatically.
       */

      const response =
        await authenticatedFetch(
          `${API_URL}/api/career/profile/from-resume`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              ...resumeProfile,

              resume_id:
                uploadData.resume_id ||
                null,

              filename:
                uploadData.filename ||
                null,
            }),
          }
        );

      let data: CareerSyncResponse =
        {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        console.warn(
          "Career profile sync failed:",
          data
        );

        setCareerSyncStatus(
          "failed"
        );

        if (
          response.status === 401
        ) {
          setError(
            "Resume was analyzed, but your login session could not be verified. Please log in again to save your career profile."
          );
        }

        return false;
      }

      if (
        data.status !==
        "success"
      ) {
        console.warn(
          "Career profile sync returned an unexpected response:",
          data
        );

        setCareerSyncStatus(
          "failed"
        );

        return false;
      }

      console.log(
        "Career profile persisted successfully:",
        data
      );

      setCareerSyncStatus(
        "success"
      );

      return true;
    } catch (err) {
      console.warn(
        "Career profile sync error:",
        err
      );

      setCareerSyncStatus(
        "failed"
      );

      if (
        err instanceof Error &&
        err.message.includes(
          "You must be logged in"
        )
      ) {
        setError(
          "Resume was analyzed successfully, but you need to be logged in to save your career profile."
        );
      }

      return false;
    }
  }

  /* ==========================================================
     UPLOAD + ANALYZE
  ========================================================== */

  async function uploadResume() {
    if (!selectedFile) {
      setError(
        "Please select a resume first."
      );

      return;
    }

    setLoading(true);

    setError("");

    setResult(null);

    setCareerSyncStatus(
      "idle"
    );

    try {
      /* ======================================================
         STEP 1 — CHECK LOGIN
      ====================================================== */

      const currentUser =
        await getCurrentUser();

      if (currentUser) {
        setLoggedInUser({
          id: currentUser.id,
          email:
            currentUser.email ||
            undefined,
        });
      } else {
        setLoggedInUser(null);
      }

      /* ======================================================
         STEP 2 — UPLOAD RESUME
      ====================================================== */

      const formData =
        new FormData();

      formData.append(
        "file",
        selectedFile
      );

      const response =
        await authenticatedFetch(
          `${API_URL}/api/resume/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

      let data: UploadResponse;

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          "The backend returned an invalid response."
        );
      }

      /* ======================================================
         STEP 3 — CHECK UPLOAD RESPONSE
      ====================================================== */

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Resume upload failed."
        );
      }

      if (
        data.status !==
        "success"
      ) {
        throw new Error(
          data.message ||
            "Unable to analyze resume."
        );
      }

      if (
        !data.candidate_profile
      ) {
        throw new Error(
          "Resume was uploaded, but no candidate profile was generated."
        );
      }

      /* ======================================================
         STEP 4 — SHOW ANALYSIS
      ====================================================== */

      setResult(data);

      /* ======================================================
         STEP 5 — SAVE CAREER PROFILE
      ====================================================== */

      await syncCareerProfile(
        data.candidate_profile,
        data
      );
    } catch (err) {
      console.error(
        "Resume upload error:",
        err
      );

      setResult(null);

      setCareerSyncStatus(
        "idle"
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while uploading the resume."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ==========================================================
     PROFILE DATA
  ========================================================== */

  const profile =
    result?.candidate_profile;

  const candidate =
    profile?.candidate;

  const skills =
    profile?.skills;

  const programming =
    cleanArray(
      skills?.programming
    );

  const dataAnalysis =
    cleanArray(
      skills?.data_analysis
    );

  const machineLearning =
    cleanArray(
      skills?.machine_learning
    );

  const visualization =
    cleanArray(
      skills?.visualization
    );

  const deployment =
    cleanArray(
      skills?.deployment
    );

  const otherSkills =
    cleanArray(
      skills?.other
    );

  const allSkills =
    cleanArray([
      ...programming,
      ...dataAnalysis,
      ...machineLearning,
      ...visualization,
      ...deployment,
      ...otherSkills,
    ]);

  const positions =
    profile?.experience
      ?.positions || [];

  const education =
    profile?.education || [];

  const projects =
    profile?.projects || [];

  const achievements =
    cleanArray(
      profile?.achievements
    );

  const recommendedRoles =
    cleanArray(
      profile?.recommended_roles
    );

  /* ==========================================================
     RESET
  ========================================================== */

  function resetAnalysis() {
    setResult(null);

    setSelectedFile(null);

    setError("");

    setDragActive(false);

    setCareerSyncStatus(
      "idle"
    );
  }

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

          <Link
            href="/"
            className="text-xl font-bold tracking-tight"
          >
            <span className="text-slate-900">
              Career
            </span>

            <span className="text-blue-600">
              AI
            </span>
          </Link>

          <div className="flex items-center gap-3">

            {loggedInUser && (
              <span className="hidden text-xs text-slate-400 sm:block">
                {loggedInUser.email}
              </span>
            )}

            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
            >
              Browse Jobs

              <ArrowRight
                size={16}
              />
            </Link>

          </div>

        </div>

      </header>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* TITLE */}

        <div className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Career Intelligence
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Analyze Your Resume
          </h1>

          <p className="mt-3 max-w-2xl text-slate-600">
            Upload your resume and let CareerAI
            extract your skills, experience,
            education, projects and recommended
            career roles.
          </p>

        </div>

        {/* ====================================================
            UPLOAD SECTION
        ==================================================== */}

        {!result && (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

            <div
              onDragOver={
                handleDragOver
              }
              onDragLeave={
                handleDragLeave
              }
              onDrop={
                handleDrop
              }
              className={`rounded-2xl border-2 border-dashed p-10 text-center transition ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-300 bg-slate-50"
              }`}
            >

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">

                <Upload
                  size={30}
                />

              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-900">
                Upload your resume
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Drag & drop your resume here,
                or choose a file from your computer.
              </p>

              <p className="mt-2 text-xs text-slate-400">
                PDF, DOCX or TXT · Maximum 5 MB
              </p>

              <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700">

                <FileText
                  size={18}
                />

                Choose Resume

                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={
                    handleFileChange
                  }
                />

              </label>

            </div>

            {/* SELECTED FILE */}

            {selectedFile && (
              <div className="mt-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">

                    <FileText
                      size={20}
                    />

                  </div>

                  <div>

                    <p className="break-all font-medium text-slate-900">
                      {selectedFile.name}
                    </p>

                    <p className="text-xs text-slate-500">
                      {(
                        selectedFile.size /
                        1024
                      ).toFixed(1)}
                      KB
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(
                      null
                    );

                    setCareerSyncStatus(
                      "idle"
                    );
                  }}
                  className="text-left text-sm font-medium text-red-500 hover:text-red-600 sm:text-right"
                >
                  Remove
                </button>

              </div>
            )}

            {/* LOGIN NOTICE */}

            {!loggedInUser && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">

                <div className="flex items-start gap-3">

                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />

                  <div>

                    <p className="text-sm font-semibold text-amber-800">
                      Login to save your career profile
                    </p>

                    <p className="mt-1 text-xs leading-5 text-amber-700">
                      Resume analysis can be viewed,
                      but you need to be logged in for
                      CareerAI to save your profile and
                      personalized job preferences.
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">

                      <Link
                        href="/login"
                        className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                      >
                        Log In
                      </Link>

                      <Link
                        href="/signup"
                        className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                      >
                        Create Account
                      </Link>

                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* ERROR */}

            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">

                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0"
                />

                <p className="text-sm">
                  {error}
                </p>

              </div>
            )}

            {/* ANALYZE */}

            <div className="mt-6 flex justify-end">

              <button
                type="button"
                onClick={
                  uploadResume
                }
                disabled={
                  !selectedFile ||
                  loading
                }
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-7 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    Analyzing Resume...
                  </>
                ) : (
                  <>
                    Analyze Resume

                    <ArrowRight
                      size={18}
                    />
                  </>
                )}

              </button>

            </div>

          </section>
        )}

        {/* ====================================================
            ANALYSIS RESULT
        ==================================================== */}

        {result && profile && (
          <div className="space-y-6">

            {/* SUCCESS */}

            <div className="flex flex-col gap-4 rounded-2xl border border-green-200 bg-green-50 p-5 md:flex-row md:items-center md:justify-between">

              <div className="flex items-start gap-3">

                <CheckCircle2
                  size={22}
                  className="mt-0.5 shrink-0 text-green-600"
                />

                <div>

                  <p className="font-semibold text-green-800">
                    Resume analyzed successfully
                  </p>

                  <p className="mt-1 text-sm text-green-700">
                    {result.filename}
                  </p>

                </div>

              </div>

              <div className="flex flex-wrap items-center gap-2">

                <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-medium text-green-700">

                  {result.profile_source ===
                  "gemini"
                    ? "AI Analysis"
                    : "Resume Parser Analysis"}

                </span>

                {careerSyncStatus ===
                  "success" && (
                  <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-700">

                    <CheckCircle2
                      size={12}
                    />

                    Profile Saved
                  </span>
                )}

                {careerSyncStatus ===
                  "syncing" && (
                  <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-700">

                    <Loader2
                      size={12}
                      className="animate-spin"
                    />

                    Saving Profile...
                  </span>
                )}

                {careerSyncStatus ===
                  "failed" && (
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-700">
                    Profile Sync Unavailable
                  </span>
                )}

              </div>

            </div>

            {/* CANDIDATE PROFILE */}

            <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">

                <div>

                  <p className="text-sm font-medium text-blue-600">
                    Candidate Profile
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    {candidate?.name ||
                      "Candidate"}
                  </h2>

                  <div className="mt-4 space-y-2 text-sm text-slate-500">

                    {candidate?.email && (
                      <div className="flex items-center gap-2">
                        <Mail
                          size={15}
                          className="text-slate-400"
                        />
                        <span>
                          {candidate.email}
                        </span>
                      </div>
                    )}

                    {candidate?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone
                          size={15}
                          className="text-slate-400"
                        />
                        <span>
                          {candidate.phone}
                        </span>
                      </div>
                    )}

                    {candidate?.location && (
                      <div className="flex items-center gap-2">
                        <MapPin
                          size={15}
                          className="text-slate-400"
                        />
                        <span>
                          {candidate.location}
                        </span>
                      </div>
                    )}

                  </div>

                </div>

                <div className="rounded-2xl bg-blue-50 px-8 py-5 text-center">

                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    Career Level
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {profile.career_level ||
                      "Not specified"}
                  </p>

                </div>

              </div>

            </section>

            {/* PROFESSIONAL SUMMARY */}

            {profile.professional_summary && (
              <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

                <h2 className="text-xl font-bold text-slate-900">
                  Professional Summary
                </h2>

                <p className="mt-4 leading-7 text-slate-600">
                  {
                    profile.professional_summary
                  }
                </p>

              </section>
            )}

            {/* STATS */}

            <div className="grid gap-4 md:grid-cols-3">

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                    <Code2
                      size={22}
                    />

                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      Skills Identified
                    </p>

                    <p className="text-2xl font-bold text-slate-900">
                      {allSkills.length}
                    </p>

                  </div>

                </div>

              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">

                    <Briefcase
                      size={22}
                    />

                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      Total Experience
                    </p>

                    <p className="text-2xl font-bold text-slate-900">
                      {formatYears(
                        profile.experience
                          ?.total_years
                      )}{" "}
                      yrs
                    </p>

                  </div>

                </div>

              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">

                    <FolderKanban
                      size={22}
                    />

                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      Projects
                    </p>

                    <p className="text-2xl font-bold text-slate-900">
                      {projects.length}
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* EXPERIENCE */}

            {positions.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

                <div className="flex items-center gap-3">

                  <Briefcase
                    size={21}
                    className="text-blue-600"
                  />

                  <h2 className="text-xl font-bold text-slate-900">
                    Professional Experience
                  </h2>

                </div>

                <div className="mt-5 space-y-4">

                  {positions.map(
                    (
                      position,
                      index
                    ) => (
                      <div
                        key={`${position.title}-${index}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                      >

                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">

                          <div>

                            <h3 className="font-bold text-slate-900">
                              {position.title ||
                                "Position"}
                            </h3>

                            {position.organization && (
                              <p className="mt-1 text-sm font-medium text-blue-600">
                                {
                                  position.organization
                                }
                              </p>
                            )}

                          </div>

                          <div className="text-left md:text-right">

                            {position.duration && (
                              <p className="text-sm font-medium text-slate-600">
                                {
                                  position.duration
                                }
                              </p>
                            )}

                            {position.type && (
                              <p className="mt-1 text-xs text-slate-400">
                                {position.type}
                              </p>
                            )}

                          </div>

                        </div>

                        {position.description && (
                          <p className="mt-4 leading-6 text-slate-600">
                            {
                              position.description
                            }
                          </p>
                        )}

                      </div>
                    )
                  )}

                </div>

              </section>
            )}

            {/* SKILLS */}

            {allSkills.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

                <div className="flex items-center justify-between">

                  <h2 className="text-xl font-bold text-slate-900">
                    Skills
                  </h2>

                  <span className="text-sm text-slate-500">
                    {allSkills.length} identified
                  </span>

                </div>

                <div className="mt-6 space-y-6">

                  {programming.length > 0 && (
                    <SkillGroup
                      title="Programming & Databases"
                      skills={
                        programming
                      }
                    />
                  )}

                  {dataAnalysis.length > 0 && (
                    <SkillGroup
                      title="Data Analysis"
                      skills={
                        dataAnalysis
                      }
                    />
                  )}

                  {machineLearning.length > 0 && (
                    <SkillGroup
                      title="Machine Learning"
                      skills={
                        machineLearning
                      }
                    />
                  )}

                  {visualization.length > 0 && (
                    <SkillGroup
                      title="Visualization & BI"
                      skills={
                        visualization
                      }
                    />
                  )}

                  {deployment.length > 0 && (
                    <SkillGroup
                      title="Deployment & MLOps"
                      skills={
                        deployment
                      }
                    />
                  )}

                  {otherSkills.length > 0 && (
                    <SkillGroup
                      title="Other Skills"
                      skills={
                        otherSkills
                      }
                    />
                  )}

                </div>

              </section>
            )}

            {/* RECOMMENDED ROLES */}

            {recommendedRoles.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

                <h2 className="text-xl font-bold text-slate-900">
                  Recommended Career Roles
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Roles suggested based on the
                  skills and experience found in
                  the uploaded resume.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                  {recommendedRoles.map(
                    (
                      role,
                      index
                    ) => (
                      <div
                        key={`${role}-${index}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
                      >

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">

                            <Briefcase
                              size={18}
                            />

                          </div>

                          <p className="font-semibold text-slate-800">
                            {role}
                          </p>

                        </div>

                      </div>
                    )
                  )}

                </div>

              </section>
            )}

            {/* PROJECTS */}

            {projects.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

                <div className="flex items-center gap-3">

                  <FolderKanban
                    size={21}
                    className="text-blue-600"
                  />

                  <h2 className="text-xl font-bold text-slate-900">
                    Projects
                  </h2>

                </div>

                <div className="mt-5 space-y-4">

                  {projects.map(
                    (
                      project,
                      index
                    ) => (
                      <div
                        key={`${project.name}-${index}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                      >

                        <h3 className="font-bold text-slate-900">
                          {project.name ||
                            "Project"}
                        </h3>

                        {project.description && (
                          <p className="mt-2 leading-6 text-slate-600">
                            {
                              project.description
                            }
                          </p>
                        )}

                        {project.technologies &&
                          project.technologies.length >
                            0 && (
                            <div className="mt-4 flex flex-wrap gap-2">

                              {project.technologies.map(
                                (
                                  technology,
                                  techIndex
                                ) => (
                                  <span
                                    key={`${technology}-${techIndex}`}
                                    className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
                                  >
                                    {
                                      technology
                                    }
                                  </span>
                                )
                              )}

                            </div>
                          )}

                        {project.impact && (
                          <div className="mt-4 rounded-lg border border-green-100 bg-green-50 p-3">

                            <p className="text-sm font-medium text-green-700">
                              Impact:{" "}
                              {
                                project.impact
                              }
                            </p>

                          </div>
                        )}

                      </div>
                    )
                  )}

                </div>

              </section>
            )}

            {/* EDUCATION */}

            {education.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

                <div className="flex items-center gap-3">

                  <GraduationCap
                    size={21}
                    className="text-blue-600"
                  />

                  <h2 className="text-xl font-bold text-slate-900">
                    Education
                  </h2>

                </div>

                <div className="mt-5 space-y-4">

                  {education.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={`${item.degree}-${index}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                      >

                        <h3 className="font-bold text-slate-900">
                          {item.degree ||
                            "Education"}
                        </h3>

                        {item.institution && (
                          <p className="mt-1 text-sm text-slate-600">
                            {
                              item.institution
                            }
                          </p>
                        )}

                        {(item.status ||
                          item.year) && (
                          <p className="mt-2 text-xs text-slate-500">

                            {item.status}

                            {item.status &&
                              item.year &&
                              " · "}

                            {item.year}

                          </p>
                        )}

                      </div>
                    )
                  )}

                </div>

              </section>
            )}

            {/* ACHIEVEMENTS */}

            {achievements.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

                <div className="flex items-center gap-3">

                  <Award
                    size={21}
                    className="text-blue-600"
                  />

                  <h2 className="text-xl font-bold text-slate-900">
                    Achievements
                  </h2>

                </div>

                <div className="mt-5 space-y-3">

                  {achievements.map(
                    (
                      achievement,
                      index
                    ) => (
                      <div
                        key={`${achievement}-${index}`}
                        className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >

                        <CheckCircle2
                          size={18}
                          className="mt-0.5 shrink-0 text-green-600"
                        />

                        <p className="text-sm leading-6 text-slate-700">
                          {achievement}
                        </p>

                      </div>
                    )
                  )}

                </div>

              </section>
            )}

            {/* CAREER SYNC SUCCESS */}

            {careerSyncStatus ===
              "success" && (
              <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">

                <div className="flex items-start gap-3">

                  <CheckCircle2
                    size={22}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />

                  <div>

                    <h3 className="font-bold text-blue-900">
                      Career Profile Saved
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-blue-800">
                      Your resume-derived skills,
                      experience, target role and
                      career direction have been
                      saved to your account.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">

                      <Link
                        href="/career-intelligence"
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        Career Intelligence

                        <ArrowRight
                          size={14}
                        />
                      </Link>

                      <Link
                        href="/?mode=matching"
                        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        <Search
                          size={14}
                        />

                        Find Matching Jobs
                      </Link>

                      <Link
                        href="/career-assistant"
                        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        <MessageCircle
                          size={14}
                        />

                        Ask CareerAI
                      </Link>

                    </div>

                  </div>

                </div>

              </section>
            )}

            {/* CAREER SYNC FAILED */}

            {careerSyncStatus ===
              "failed" && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">

                <div className="flex items-start gap-3">

                  <AlertCircle
                    size={22}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />

                  <div>

                    <h3 className="font-bold text-amber-900">
                      Career Profile Was Not Saved
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-amber-800">
                      Your resume was analyzed
                      successfully, but Career
                      Intelligence could not save the
                      profile to your account.
                    </p>

                    {!loggedInUser && (
                      <div className="mt-4 flex flex-wrap gap-2">

                        <Link
                          href="/login"
                          className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                        >
                          Log In
                        </Link>

                        <Link
                          href="/signup"
                          className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                        >
                          Create Account
                        </Link>

                      </div>
                    )}

                  </div>

                </div>

              </section>
            )}

            {/* ACTION SECTION */}

            <section className="rounded-2xl bg-slate-900 p-8 text-white">

              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

                <div>

                  <h2 className="text-2xl font-bold">
                    Ready to find your next opportunity?
                  </h2>

                  <p className="mt-2 max-w-xl text-slate-300">
                    Use your saved resume profile to
                    discover jobs matching your skills
                    and career direction.
                  </p>

                </div>

                <div className="flex flex-wrap gap-3">

                  <Link
                    href="/?mode=matching"
                    className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                  >

                    <Search
                      size={18}
                    />

                    Find Matching Jobs

                    <ArrowRight
                      size={18}
                    />

                  </Link>

                  <Link
                    href="/career-assistant"
                    className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-6 py-3 font-semibold text-white hover:bg-slate-700"
                  >

                    <MessageCircle
                      size={18}
                    />

                    Ask CareerAI

                  </Link>

                </div>

              </div>

            </section>

            {/* ANALYZE ANOTHER */}

            <div className="flex justify-center pb-4">

              <button
                type="button"
                onClick={
                  resetAnalysis
                }
                className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
              >
                Analyze another resume
              </button>

            </div>

          </div>
        )}

      </div>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-6 py-6 text-center text-sm text-slate-500">
          © 2026 CareerAI Job Board · AI-powered career intelligence
        </div>

      </footer>

    </main>
  );
}

/* ============================================================
   SKILL GROUP
============================================================ */

function SkillGroup({
  title,
  skills,
}: {
  title: string;
  skills: string[];
}) {
  return (
    <div>

      <h3 className="mb-3 text-sm font-semibold text-slate-700">
        {title}
      </h3>

      <div className="flex flex-wrap gap-2">

        {skills.map(
          (
            skill,
            index
          ) => (
            <span
              key={`${skill}-${index}`}
              className="rounded-full bg-blue-50 px-3.5 py-2 text-sm font-medium text-blue-700"
            >
              {skill}
            </span>
          )
        )}

      </div>

    </div>
  );
}