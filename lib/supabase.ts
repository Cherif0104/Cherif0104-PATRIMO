import { createClient } from "@supabase/supabase-js";
import type { AppState } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = url && key ? createClient(url, key) : null;

export async function loadRemoteState(): Promise<AppState | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("ameena_state")
    .select("payload")
    .eq("id", "live")
    .maybeSingle();
  if (error || !data?.payload) return null;
  return data.payload as AppState;
}

export async function saveRemoteState(state: AppState) {
  if (!supabase) return;
  const { error } = await supabase.from("ameena_state").upsert({
    id: "live",
    payload: state,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
