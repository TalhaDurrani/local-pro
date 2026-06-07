import { createClient } from "./supabase/client";

// Singleton browser client. Uses @supabase/ssr (cookie-based) so the session
// is visible to middleware and Server Components.
export const supabase = createClient();
