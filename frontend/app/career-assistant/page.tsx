"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUp,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Sparkles,
  Target,
  UserRound,
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

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestedAction?: string;
  source?: string;
};

type AssistantResponse = {
  status?: string;
  source?: string;
  message?: string;
  target_role?: string;
  answer?: string;
  suggested_action?: string;
  ai_error?: string;
};

/* ============================================================
   QUICK PROMPTS
============================================================ */

const QUICK_PROMPTS = [
  "What skills should I improve next?",
  "Am I ready for my target role?",
  "What career path should I follow?",
  "What should I focus on to get a job?",
];

/* ============================================================
   PAGE
============================================================ */

export default function CareerAssistantPage() {
  const [messages, setMessages] =
    useState<Message[]>([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hi! I'm CareerAI. I can help you understand your skills, career direction, job readiness, skill gaps and next career steps.",
        source: "system",
      },
    ]);

  const [input, setInput] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [targetRole, setTargetRole] =
    useState("");

  const messagesEndRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(
      null
    );

  /* ==========================================================
     AUTO SCROLL
  ========================================================== */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      }
    );
  }, [messages, loading]);

  /* ==========================================================
     FETCH PROFILE
  ========================================================== */

  useEffect(() => {
    async function loadProfile() {
      try {
        const response =
          await fetch(
            `${API_URL}/api/career/profile`,
            {
              cache: "no-store",
            }
          );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        if (
          data.status === "success" &&
          data.profile
        ) {
          setTargetRole(
            data.profile.target_role ||
              ""
          );
        }
      } catch (err) {
        console.warn(
          "Unable to load career profile:",
          err
        );
      }
    }

    loadProfile();
  }, []);

  /* ==========================================================
     SEND MESSAGE
  ========================================================== */

  async function sendMessage(
    event?: FormEvent
  ) {
    event?.preventDefault();

    const question =
      input.trim();

    if (!question || loading) {
      return;
    }

    setError("");

    const userMessage: Message = {
      id:
        `user-${Date.now()}`,
      role: "user",
      content: question,
    };

    setMessages(
      (previous) => [
        ...previous,
        userMessage,
      ]
    );

    setInput("");

    setLoading(true);

    try {
      const response =
        await fetch(
          `${API_URL}/api/career/assistant`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              message: question,
            }),
          }
        );

      let data: AssistantResponse =
        {};

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          "The backend returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to contact CareerAI."
        );
      }

      if (
        data.status !==
        "success"
      ) {
        throw new Error(
          data.message ||
            "CareerAI could not process your question."
        );
      }

      const assistantMessage: Message =
        {
          id:
            `assistant-${Date.now()}`,
          role: "assistant",
          content:
            data.answer ||
            "I could not generate an answer right now.",
          suggestedAction:
            data.suggested_action ||
            undefined,
          source:
            data.source ||
            undefined,
        };

      setMessages(
        (previous) => [
          ...previous,
          assistantMessage,
        ]
      );

      if (
        data.target_role
      ) {
        setTargetRole(
          data.target_role
        );
      }
    } catch (err) {
      console.error(
        "Career Assistant error:",
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong.";

      setError(message);

      setMessages(
        (previous) => [
          ...previous,
          {
            id:
              `assistant-error-${Date.now()}`,
            role: "assistant",
            content:
              "I'm sorry, I couldn't process that request. Please try again.",
            source: "error",
          },
        ]
      );
    } finally {
      setLoading(false);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }

  /* ==========================================================
     KEYBOARD
  ========================================================== */

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendMessage();
    }
  }

  /* ==========================================================
     QUICK PROMPT
  ========================================================== */

  function useQuickPrompt(
    prompt: string
  ) {
    setInput(prompt);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  }

  /* ==========================================================
     CLEAR CHAT
  ========================================================== */

  function clearConversation() {
    setMessages([
      {
        id:
          `welcome-${Date.now()}`,
        role: "assistant",
        content:
          "Conversation cleared. What would you like to know about your career?",
        source: "system",
      },
    ]);

    setError("");

    setInput("");

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  }

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

          <div className="flex items-center gap-5">

            <Link
              href="/career-intelligence"
              className="flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
            >
              <ArrowLeft
                size={17}
              />
              Career Intelligence
            </Link>

            <div className="hidden h-6 w-px bg-slate-200 sm:block" />

            <div className="flex items-center gap-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <Bot
                  size={19}
                  className="text-blue-600"
                />
              </div>

              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  Career
                  <span className="text-blue-600">
                    AI
                  </span>
                </h1>

                <p className="text-[11px] text-slate-500">
                  Career Assistant
                </p>
              </div>

            </div>

          </div>

          <div className="flex items-center gap-2">

            {targetRole && (
              <div className="hidden items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 sm:flex">
                <Target size={13} />
                {targetRole}
              </div>
            )}

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
              <UserRound
                size={17}
                className="text-slate-500"
              />
            </div>

          </div>

        </div>

      </header>

      {/* ======================================================
          PAGE
      ====================================================== */}

      <div className="mx-auto max-w-6xl px-6 py-8">

        {/* ====================================================
            HERO
        ==================================================== */}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div className="max-w-3xl">

              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                <Sparkles size={13} />
                AI Career Assistant
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Ask anything about your career.
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Get practical guidance on your
                skills, career path, job readiness,
                opportunities and next steps.
              </p>

            </div>

            <Link
              href="/?mode=matching"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <BriefcaseBusiness
                size={17}
              />
              Find Matching Jobs
            </Link>

          </div>

        </section>

        {/* ====================================================
            CHAT LAYOUT
        ==================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* CHAT HEADER */}

          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <MessageCircle
                  size={20}
                  className="text-blue-600"
                />
              </div>

              <div>

                <h3 className="font-bold text-slate-900">
                  CareerAI Assistant
                </h3>

                <p className="text-xs text-slate-500">
                  Personalized career guidance
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={
                clearConversation
              }
              className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            >
              Clear Chat
            </button>

          </div>

          {/* CHAT BODY */}

          <div className="min-h-[520px] max-h-[620px] overflow-y-auto bg-slate-50/70 px-4 py-6 sm:px-6">

            <div className="mx-auto max-w-4xl space-y-5">

              {messages.map(
                (message) => {

                  const isUser =
                    message.role ===
                    "user";

                  return (
                    <div
                      key={
                        message.id
                      }
                      className={`flex ${
                        isUser
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >

                      <div
                        className={`flex max-w-[90%] gap-3 sm:max-w-[78%] ${
                          isUser
                            ? "flex-row-reverse"
                            : "flex-row"
                        }`}
                      >

                        {/* AVATAR */}

                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            isUser
                              ? "bg-slate-900 text-white"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >

                          {isUser ? (
                            <UserRound
                              size={17}
                            />
                          ) : (
                            <Bot
                              size={17}
                            />
                          )}

                        </div>

                        {/* MESSAGE */}

                        <div>

                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              isUser
                                ? "rounded-tr-md bg-slate-900 text-white"
                                : "rounded-tl-md border border-slate-200 bg-white text-slate-700"
                            }`}
                          >

                            <p
                              className={`whitespace-pre-wrap text-sm leading-7 ${
                                isUser
                                  ? "text-white"
                                  : "text-slate-700"
                              }`}
                            >
                              {
                                message.content
                              }
                            </p>

                          </div>

                          {/* SUGGESTED ACTION */}

                          {!isUser &&
                            message.suggestedAction && (
                              <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">

                                <p className="text-xs font-semibold text-blue-700">
                                  Suggested next step
                                </p>

                                <p className="mt-1 text-xs leading-5 text-blue-800">
                                  {
                                    message.suggestedAction
                                  }
                                </p>

                              </div>
                            )}

                          {/* SOURCE */}

                          {!isUser &&
                            message.source &&
                            message.source !==
                              "system" &&
                            message.source !==
                              "error" && (
                              <p className="mt-1.5 px-1 text-[10px] text-slate-400">
                                Powered by{" "}
                                {message.source ===
                                "gemini"
                                  ? "Gemini"
                                  : "CareerAI"}
                              </p>
                            )}

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

              {/* LOADING */}

              {loading && (
                <div className="flex justify-start">

                  <div className="flex items-start gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <Bot
                        size={17}
                      />
                    </div>

                    <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3">

                      <div className="flex items-center gap-2">

                        <Loader2
                          size={16}
                          className="animate-spin text-blue-600"
                        />

                        <span className="text-sm text-slate-500">
                          Thinking...
                        </span>

                      </div>

                    </div>

                  </div>

                </div>
              )}

              <div
                ref={
                  messagesEndRef
                }
              />

            </div>

          </div>

          {/* ERROR */}

          {error && (
            <div className="border-t border-red-100 bg-red-50 px-5 py-3">

              <p className="text-xs font-medium text-red-700">
                {error}
              </p>

            </div>
          )}

          {/* QUICK PROMPTS */}

          <div className="border-t border-slate-200 bg-white px-5 py-4">

            <div className="mx-auto max-w-4xl">

              <div className="mb-3 flex items-center gap-2">

                <Sparkles
                  size={14}
                  className="text-blue-600"
                />

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Try asking
                </p>

              </div>

              <div className="flex flex-wrap gap-2">

                {QUICK_PROMPTS.map(
                  (prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      disabled={
                        loading
                      }
                      onClick={() =>
                        useQuickPrompt(
                          prompt
                        )
                      }
                      className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  )
                )}

              </div>

            </div>

          </div>

          {/* INPUT */}

          <form
            onSubmit={
              sendMessage
            }
            className="border-t border-slate-200 bg-white p-4 sm:p-5"
          >

            <div className="mx-auto max-w-4xl">

              <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 transition focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-50">

                <textarea
                  ref={
                    textareaRef
                  }
                  value={input}
                  onChange={(event) =>
                    setInput(
                      event.target.value
                    )
                  }
                  onKeyDown={
                    handleKeyDown
                  }
                  disabled={loading}
                  rows={1}
                  maxLength={2000}
                  placeholder="Ask about your career, skills, jobs or next step..."
                  className="max-h-32 min-h-[46px] flex-1 resize-none bg-transparent px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                />

                <button
                  type="submit"
                  disabled={
                    !input.trim() ||
                    loading
                  }
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Send message"
                >

                  {loading ? (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <ArrowUp
                      size={19}
                    />
                  )}

                </button>

              </div>

              <div className="mt-2 flex items-center justify-between px-1">

                <p className="text-[11px] text-slate-400">
                  Press Enter to send · Shift + Enter for a new line
                </p>

                <p className="text-[11px] text-slate-400">
                  {input.length}/2000
                </p>

              </div>

            </div>

          </form>

        </section>

        {/* ====================================================
            QUICK NAVIGATION
        ==================================================== */}

        <div className="mt-6 grid gap-4 md:grid-cols-3">

          <Link
            href="/resume"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Sparkles
                  size={18}
                  className="text-blue-600"
                />
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">
                  Analyze Resume
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Refresh your career profile
                </p>
              </div>

            </div>

          </Link>

          <Link
            href="/career-intelligence"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                <Target
                  size={18}
                  className="text-purple-600"
                />
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">
                  Career Intelligence
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  View your full profile
                </p>
              </div>

            </div>

          </Link>

          <Link
            href="/?mode=matching"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                <BriefcaseBusiness
                  size={18}
                  className="text-green-600"
                />
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">
                  Matching Jobs
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  See jobs ranked for you
                </p>
              </div>

            </div>

          </Link>

        </div>

        {/* ====================================================
            TRUST NOTE
        ==================================================== */}

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-5">

          <CheckCircle2
            size={19}
            className="mt-0.5 shrink-0 text-blue-600"
          />

          <div>

            <p className="text-sm font-semibold text-blue-900">
              CareerAI uses your current career profile
            </p>

            <p className="mt-1 text-xs leading-5 text-blue-800">
              Advice is generated using the skills,
              experience, target role and preferences
              available in your CareerAI profile.
            </p>

          </div>

        </div>

      </div>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-slate-200 bg-white">

        <div className="mx-auto max-w-6xl px-6 py-6 text-center text-sm text-slate-500">
          © 2026 CareerAI Job Board · AI-powered career intelligence
        </div>

      </footer>

    </main>
  );
}