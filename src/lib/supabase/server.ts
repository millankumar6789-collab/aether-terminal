/**
 * Server-side Supabase client factory.
 *
 * Used from Server Components, Route Handlers, and Server Actions only.
 * The service-role key (SUPABASE_SERVICE_ROLE_KEY) bypasses RLS and is only
 * ever read from the server — never shipped to the browser.
 *
 * Frontend clients should use the browser client via `@supabase/ssr`'s
 * createBrowserClient — see `src/components/providers/auth-provider.tsx`.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function supabaseServer() {
  const store = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()        { return store.getAll(); },
        setAll(cooks)   { cooks.forEach(({ name, value, options }) => store.set(name, value, options)); },
      },
    },
  );
}

/**
 * Admin / service-role client — bypasses RLS.
 * ⚠️  Never import this into a Client Component. NEVER expose to the browser.
 */
export async function supabaseAdmin() {
  // Lazy-import the raw SDK so the service-role codepath can be tree-shaken
  // out of the client bundle.
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
