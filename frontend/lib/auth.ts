import { supabase } from "@/lib/supabase";

/* ============================================================
   CURRENT USER
============================================================ */

export async function getCurrentUser() {
  const {
    data,
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error(
      "Unable to get current user:",
      error
    );

    return null;
  }

  return data.user;
}

/* ============================================================
   CURRENT SESSION
============================================================ */

export async function getCurrentSession() {
  const {
    data,
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error(
      "Unable to get current session:",
      error
    );

    return null;
  }

  return data.session;
}

/* ============================================================
   ACCESS TOKEN
============================================================ */

export async function getAccessToken() {
  const session =
    await getCurrentSession();

  return (
    session?.access_token ||
    null
  );
}

/* ============================================================
   AUTHENTICATED API REQUEST
============================================================ */

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
) {
  const token =
    await getAccessToken();

  if (!token) {
    throw new Error(
      "You must be logged in to perform this action."
    );
  }

  const headers = new Headers(
    options.headers
  );

  headers.set(
    "Authorization",
    `Bearer ${token}`
  );

  if (
    options.body &&
    !headers.has(
      "Content-Type"
    ) &&
    !(options.body instanceof FormData)
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  return fetch(
    url,
    {
      ...options,
      headers,
    }
  );
}

/* ============================================================
   LOGOUT
============================================================ */

export async function signOutUser() {
  const {
    error,
  } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}