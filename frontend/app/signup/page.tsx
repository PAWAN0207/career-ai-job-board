"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  LockKeyhole,
  Mail,
  UserRound,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function handleSignup(
    event: FormEvent
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanName =
      name.trim();

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanName) {
      setError(
        "Please enter your name."
      );
      return;
    }

    if (!cleanEmail) {
      setError(
        "Please enter your email."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    setLoading(true);

    try {
      const {
        data,
        error: signupError,
      } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name:
                cleanName,
            },
          },
        });

      if (signupError) {
        throw signupError;
      }

      /*
       * Depending on Supabase email-confirmation settings,
       * session may be immediately available or null.
       */

      if (data.session) {
        router.push(
          "/career-intelligence"
        );
        return;
      }

      setSuccess(
        "Account created successfully. Please check your email to verify your account, then log in."
      );
    } catch (err) {
      console.error(
        "Signup error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

          <Link
            href="/"
            className="text-xl font-bold tracking-tight"
          >
            Career
            <span className="text-blue-600">
              AI
            </span>
          </Link>

          <Link
            href="/login"
            className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
          >
            Already have an account?
            <span className="ml-1 text-blue-600">
              Log in
            </span>
          </Link>

        </div>

      </header>

      {/* CONTENT */}

      <div className="mx-auto flex min-h-[calc(100vh-81px)] max-w-6xl items-center px-6 py-10">

        <div className="grid w-full gap-8 lg:grid-cols-2">

          {/* LEFT */}

          <div className="hidden flex-col justify-center lg:flex">

            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              <Sparkles
                size={15}
              />
              Career Intelligence
            </div>

            <h1 className="mt-5 max-w-xl text-4xl font-bold tracking-tight text-slate-900">
              Build a smarter career profile with CareerAI.
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              Create your account to save your career
              profile, resume insights, personalized
              job matches and career recommendations.
            </p>

            <div className="mt-7 space-y-3">

              {[
                "Personalized job recommendations",
                "Resume-powered career intelligence",
                "AI career assistant",
              ].map(
                (item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2
                      size={18}
                      className="shrink-0 text-green-600"
                    />

                    <span className="text-sm font-medium text-slate-700">
                      {item}
                    </span>
                  </div>
                )
              )}

            </div>

          </div>

          {/* SIGNUP CARD */}

          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">

            <div className="mb-7">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <UserRound
                  size={22}
                />
              </div>

              <h2 className="mt-5 text-2xl font-bold text-slate-900">
                Create your account
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Start building your personalized CareerAI profile.
              </p>

            </div>

            {/* ERROR */}

            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <p>
                  {error}
                </p>

              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">

                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <p>
                  {success}
                </p>

              </div>
            )}

            <form
              onSubmit={
                handleSignup
              }
              className="space-y-5"
            >

              {/* NAME */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Full Name
                </label>

                <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-50">

                  <UserRound
                    size={17}
                    className="text-slate-400"
                  />

                  <input
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value
                      )
                    }
                    placeholder="Enter your full name"
                    autoComplete="name"
                    className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-400"
                  />

                </div>

              </div>

              {/* EMAIL */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>

                <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-50">

                  <Mail
                    size={17}
                    className="text-slate-400"
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-400"
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </label>

                <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-50">

                  <LockKeyhole
                    size={17}
                    className="text-slate-400"
                  />

                  <input
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-400"
                  />

                </div>

              </div>

              {/* CONFIRM PASSWORD */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Confirm Password
                </label>

                <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-50">

                  <LockKeyhole
                    size={17}
                    className="text-slate-400"
                  />

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-400"
                  />

                </div>

              </div>

              {/* SUBMIT */}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight
                      size={18}
                    />
                  </>
                )}

              </button>

            </form>

            <div className="mt-6 text-center text-sm text-slate-500">

              Already have an account?{" "}

              <Link
                href="/login"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Log in
              </Link>

            </div>

          </div>

        </div>

      </div>

      {/* FOOTER */}

      <footer className="border-t border-slate-200 bg-white">

        <div className="mx-auto max-w-6xl px-6 py-5 text-center text-xs text-slate-500">
          © 2026 CareerAI Job Board · AI-powered career intelligence
        </div>

      </footer>

    </main>
  );
}