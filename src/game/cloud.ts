import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Atman } from "./store";
import type { Form } from "./data";

/**
 * Optional cloud save. If VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY aren't set
 * (e.g. a plain GitHub Pages build with no backend configured), every function
 * here is a silent no-op and the game plays entirely from local state, exactly
 * as before. Configure Supabase and the soul's journey persists across visits
 * and devices instead.
 */

export type SoulSnapshot = { life: number; form: Form; atman: Atman; journal: string[] };

let client: SupabaseClient | null | undefined;

function getClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  client = url && key ? createClient(url, key) : null;
  return client;
}

export function cloudEnabled(): boolean {
  return getClient() !== null;
}

/** Anonymous Supabase auth gives each browser a real, RLS-protected identity without a login screen. */
async function ensureSession(c: SupabaseClient): Promise<string | null> {
  const { data } = await c.auth.getSession();
  if (data.session) return data.session.user.id;
  const { data: signedIn, error } = await c.auth.signInAnonymously();
  if (error) {
    console.warn("Laws of Karma: anonymous sign-in failed", error);
    return null;
  }
  return signedIn.user?.id ?? null;
}

export async function saveSoul(snapshot: SoulSnapshot): Promise<void> {
  const c = getClient();
  if (!c) return;
  try {
    const userId = await ensureSession(c);
    if (!userId) return;
    const { error } = await c.from("souls").upsert({
      user_id: userId,
      life: snapshot.life,
      form: snapshot.form,
      atman: snapshot.atman,
      journal: snapshot.journal,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn("Laws of Karma: cloud save failed", error);
  } catch (err) {
    console.warn("Laws of Karma: cloud save failed", err);
  }
}

export async function loadSoul(): Promise<SoulSnapshot | null> {
  const c = getClient();
  if (!c) return null;
  try {
    const userId = await ensureSession(c);
    if (!userId) return null;
    const { data, error } = await c
      .from("souls")
      .select("life, form, atman, journal")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return data as SoulSnapshot;
  } catch (err) {
    console.warn("Laws of Karma: cloud load failed", err);
    return null;
  }
}
