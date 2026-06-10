'use client';

import type { Persona } from '@/mocks/personas';

/**
 * Locally-persisted *non-secret* metadata for users the Admin creates via
 * /admin/users/new. Surfaced on the /login credential helper so reviewers
 * can see "yes that student I just created shows up here" — but only the
 * identity fields. **Passwords are never persisted** because runtime-created
 * users are real accounts whose credentials leaking from any browser would
 * be a real breach. The seeded `PERSONAS` bundle keeps its plain-text demo
 * passwords; this store does not mirror that trade-off.
 *
 * Migration: any pre-existing entry that *does* contain a `password` (from
 * the v1 of this store before this fix) is stripped on first read AND the
 * stored payload is rewritten so the cleartext doesn't linger in localStorage.
 */
const KEY = 'm31.createdPersonas';

export type CreatedPersona = Omit<Persona, 'password'>;

export function getCreatedPersonas(): CreatedPersona[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    let didStripPassword = false;
    const cleaned: CreatedPersona[] = parsed.map((entry) => {
      const o = entry as Record<string, unknown>;
      if ('password' in o) {
        didStripPassword = true;
        const { password: _drop, ...rest } = o;
        return rest as CreatedPersona;
      }
      return o as CreatedPersona;
    });

    // Scrub on disk so v1 leakage stops after one read.
    if (didStripPassword) {
      try {
        window.localStorage.setItem(KEY, JSON.stringify(cleaned));
      } catch {
        // ignore — best-effort migration; the in-memory result is already clean.
      }
    }

    return cleaned;
  } catch {
    return [];
  }
}

export function addCreatedPersona(p: CreatedPersona): void {
  if (typeof window === 'undefined') return;
  // Belt-and-suspenders: even if a caller passes an object with `password`,
  // strip it before we touch storage.
  const { password: _drop, ...safe } = p as CreatedPersona & { password?: unknown };
  const existing = getCreatedPersonas();
  // Dedupe by id: later writes for the same id overwrite the earlier entry.
  const next = [...existing.filter((e) => e.id !== safe.id), safe as CreatedPersona];
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // localStorage full / disabled / privacy mode — silently skip.
  }
}
