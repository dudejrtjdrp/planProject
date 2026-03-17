import { createClient } from "@supabase/supabase-js";
import { assertSupabaseEnv, supabaseAnonKey, supabaseUrl } from "./config";

export function createSupabaseBrowserClient() {
  assertSupabaseEnv();
  return createClient(supabaseUrl!, supabaseAnonKey!);
}
