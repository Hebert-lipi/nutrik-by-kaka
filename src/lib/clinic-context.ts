"use client";

import { supabase } from "@/lib/supabaseClient";
import { workspaceCutoverEnabled, workspaceDualReadEnabled } from "@/lib/feature-flags";

export const ACTIVE_CLINIC_COOKIE = "nutrik_active_clinic_id";
const ACTIVE_CLINIC_CACHE_TTL_MS = 120_000;
let activeClinicCache: { id: string | null; fetchedAt: number } | null = null;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const escaped = name.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]+)`));
  if (!match?.[1]) return null;
  return decodeURIComponent(match[1]);
}

export function getPreferredActiveClinicIdFromCookie(): string | null {
  return readCookie(ACTIVE_CLINIC_COOKIE);
}

export function setActiveClinicCookie(clinicId: string | null): void {
  if (typeof document === "undefined") return;
  if (!clinicId) {
    document.cookie = `${ACTIVE_CLINIC_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    activeClinicCache = { id: null, fetchedAt: Date.now() };
    return;
  }
  document.cookie = `${ACTIVE_CLINIC_COOKIE}=${encodeURIComponent(clinicId)}; Path=/; Max-Age=604800; SameSite=Lax`;
  activeClinicCache = { id: clinicId, fetchedAt: Date.now() };
}

export async function resolveActiveClinicId(): Promise<string | null> {
  if (!workspaceDualReadEnabled && !workspaceCutoverEnabled) return null;
  const cached = activeClinicCache;
  if (cached && Date.now() - cached.fetchedAt < ACTIVE_CLINIC_CACHE_TTL_MS) {
    return cached.id;
  }
  const preferred = getPreferredActiveClinicIdFromCookie();
  const { data, error } = await supabase.rpc("resolve_active_clinic_id", {
    p_preferred_clinic_id: preferred,
  });
  if (error) return null;
  const resolved = typeof data === "string" && data.length > 0 ? data : null;
  if (resolved) setActiveClinicCookie(resolved);
  activeClinicCache = { id: resolved, fetchedAt: Date.now() };
  return resolved;
}
