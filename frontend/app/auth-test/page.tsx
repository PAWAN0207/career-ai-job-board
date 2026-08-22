"use client";

import { useState } from "react";
import {
  authenticatedFetch,
} from "@/lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

export default function AuthTestPage() {
  const [authResult, setAuthResult] =
    useState("");

  const [profileResult, setProfileResult] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [profileLoading, setProfileLoading] =
    useState(false);

  async function testAuthentication() {
    setLoading(true);
    setAuthResult("");

    try {
      const response =
        await authenticatedFetch(
          `${API_URL}/api/test-auth`
        );

      const data =
        await response.json();

      setAuthResult(
        JSON.stringify(
          data,
          null,
          2
        )
      );
    } catch (error) {
      setAuthResult(
        error instanceof Error
          ? error.message
          : "Authentication test failed."
      );
    } finally {
      setLoading(false);
    }
  }

  async function testProfile() {
    setProfileLoading(true);
    setProfileResult("");

    try {
      const response =
        await authenticatedFetch(
          `${API_URL}/api/career/profile/me`
        );

      const data =
        await response.json();

      setProfileResult(
        JSON.stringify(
          data,
          null,
          2
        )
      );
    } catch (error) {
      setProfileResult(
        error instanceof Error
          ? error.message
          : "Profile test failed."
      );
    } finally {
      setProfileLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl">

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

          <h1 className="text-2xl font-bold text-slate-900">
            CareerAI Backend Test
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Verify authentication and authenticated
            career-profile persistence.
          </p>

          {/* AUTH TEST */}

          <section className="mt-8">

            <h2 className="text-lg font-bold text-slate-900">
              1. Authentication
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Verifies that Supabase access tokens are
              accepted by FastAPI.
            </p>

            <button
              type="button"
              onClick={
                testAuthentication
              }
              disabled={loading}
              className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading
                ? "Testing..."
                : "Test Authentication"}
            </button>

            {authResult && (
              <pre className="mt-4 overflow-auto rounded-xl bg-slate-900 p-5 text-sm text-white">
                {authResult}
              </pre>
            )}

          </section>

          {/* PROFILE TEST */}

          <section className="mt-10 border-t border-slate-200 pt-8">

            <h2 className="text-lg font-bold text-slate-900">
              2. Career Profile
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Reads the saved career profile for the
              currently authenticated user.
            </p>

            <button
              type="button"
              onClick={
                testProfile
              }
              disabled={profileLoading}
              className="mt-4 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              {profileLoading
                ? "Loading Profile..."
                : "Test Career Profile"}
            </button>

            {profileResult && (
              <pre className="mt-4 overflow-auto rounded-xl bg-slate-900 p-5 text-sm text-white">
                {profileResult}
              </pre>
            )}

          </section>

        </div>
      </div>
    </main>
  );
}