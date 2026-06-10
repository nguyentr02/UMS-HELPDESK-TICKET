'use client';

import type { Persona } from '@/mocks/personas';

/**
 * Locally-persisted credentials for users the Admin creates via /admin/users/new.
 * Surfaced on the /login credential helper note alongside the seeded `PERSONAS`
 * so demo reviewers can sign in as freshly-created accounts without juggling
 * the BE password out of band.
 *
 * Plain text in localStorage on purpose — this matches the seeded PERSONAS
 * export which already ships demo passwords in the bundle. **Never** reuse
 * this pattern in a non-demo build.
 */
const KEY = 'm31.createdPersonas';

export function getCreatedPersonas(): Persona[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Persona[]) : [];
  } catch {
    return [];
  }
}

export function addCreatedPersona(p: Persona): void {
  if (typeof window === 'undefined') return;
  const existing = getCreatedPersonas();
  // Dedupe by id: later writes for the same id overwrite the earlier entry.
  const next = [...existing.filter((e) => e.id !== p.id), p];
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // localStorage full / disabled / privacy mode — silently skip. The user
    // still exists on the BE; only the helper note misses them.
  }
}
