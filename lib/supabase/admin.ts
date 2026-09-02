import "server-only";
import { createClient } from "@supabase/supabase-js";

// Admin client using the service_role key.
// Bypasses RLS. Never import this from a client component.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set. Check .env.local.");
  }
  if (!key || key === "PLACEHOLDER-REPLACE-ME" || key === "YOUR-SERVICE-ROLE-KEY") {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Grab it from Supabase → Settings → API (service_role secret), paste it into .env.local, and restart the dev server.",
    );
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
