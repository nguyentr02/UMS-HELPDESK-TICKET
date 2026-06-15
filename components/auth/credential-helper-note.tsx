"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type CreatedPersona,getCreatedPersonas } from "@/lib/auth/created-personas";
import { ROLE_VI } from "@/lib/auth/nav";
import type { Role } from "@/lib/types/domain";
import { cn } from "@/lib/utils";
import { type Persona,PERSONAS } from "@/mocks/personas";

// Union covers both: seeded personas (have plain-text demo password) AND
// admin-created personas (identity only — password is never stored).
type AnyPersona = Persona | CreatedPersona;
function hasPassword(p: AnyPersona): p is Persona {
  return 'password' in p;
}

const ROLE_ORDER: Role[] = [
  "SV",
  "GV",
  "NV",
  "HelpdeskAgent",
  "HelpdeskLead",
  "DeptStaff",
  "Admin",
];

/**
 * Compact labels for the tab strip — long names like "Nhân viên phòng ban"
 * push the row onto two lines. The persona panel below still uses the full
 * `ROLE_VI` labels so context isn't lost.
 */
const ROLE_TAB_LABEL: Record<Role, string> = {
  SV: "SV",
  GV: "GV",
  NV: "NV",
  HelpdeskAgent: "Agent",
  HelpdeskLead: "Lead",
  DeptStaff: "Phòng ban",
  Admin: "Admin",
};

/**
 * Credential helper modal for the demo build. Renders a fixed top-of-screen
 * popup with a blurred backdrop dimming the rest of the page so reviewers can
 * read the prototype disclaimer + persona credentials without the login card
 * distracting underneath. Click the backdrop OR the X button to dismiss; the
 * parent owns `open` state so it can also reopen the note via the "Show
 * credentials" button on the login page.
 *
 * Picking a persona reveals its credentials AND fires `onPick(persona)` so the
 * parent form's email + password fields get auto-filled.
 */
export function CredentialHelperNote({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (persona: Persona) => void;
}) {
  const [activeRole, setActiveRole] = useState<Role>("SV");
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [createdPersonas, setCreatedPersonas] = useState<CreatedPersona[]>([]);

  // Refresh the localStorage-backed list each time the note opens, so admins
  // who just created a user (then navigated to /login) see them immediately.
  useEffect(() => {
    if (open) setCreatedPersonas(getCreatedPersonas());
  }, [open]);

  const personasByRole = useMemo(() => {
    const map = new Map<Role, AnyPersona[]>();
    for (const p of [...PERSONAS, ...createdPersonas] as AnyPersona[]) {
      const list = map.get(p.role) ?? [];
      list.push(p);
      map.set(p.role, list);
    }
    return map;
  }, [createdPersonas]);

  if (!open) return null;

  function handlePick(p: AnyPersona) {
    setRevealedId(p.id);
    // Created personas have no stored password — auto-fill email only by
    // passing an empty password through.
    onPick(hasPassword(p) ? p : { ...p, password: '' });
  }

  return (
    <>
      {/* Backdrop — blurs and dims the page behind. Click to dismiss. */}
      <button
        type="button"
        aria-label="Đóng ghi chú"
        onClick={onClose}
        className="fixed inset-0 z-40 cursor-default bg-slate-900/30 backdrop-blur-sm animate-in fade-in-0 duration-300"
      />

      {/* Note — fixed near the top, horizontally centered. Soft white card. */}
      <div className="pointer-events-none fixed inset-x-0 top-12 z-50 flex justify-center px-4 sm:top-20">
        <Card
          role="dialog"
          aria-modal="true"
          aria-labelledby="credential-helper-title"
          className="pointer-events-auto w-full max-w-3xl border border-slate-200 bg-white p-5 shadow-2xl ring-1 ring-slate-900/5 animate-in slide-in-from-top-6 fade-in-0 duration-500"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h2
                id="credential-helper-title"
                className="text-sm font-semibold text-slate-900"
              >
                PROTOTYPE ONLY — UMS Helpdesk
              </h2>
              <div className="space-y-4">
                <p className="text-sm text-slate-700 leading-relaxed">
                  This is an early model created for testing and demonstration
                  purposes. It is not the final product, may be incomplete, and
                  is not suitable for production use.
                </p>

                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-200">
                  <strong>Instructions:</strong> Choose a designated role below
                  and pick a persona; credentials will be auto-filled (click the
                  eye icon to reveal the password).
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              onClick={onClose}
              aria-label="Đóng ghi chú"
            >
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </div>

          <div
            className="mt-4 -mx-1 flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-1"
            role="tablist"
            aria-label="Vai trò"
          >
            {ROLE_ORDER.map((role) => {
              const active = role === activeRole;
              return (
                <button
                  key={role}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`personas-${role}`}
                  aria-label={`Vai trò ${ROLE_VI[role]}`}
                  onClick={() => {
                    setActiveRole(role);
                    setRevealedId(null);
                  }}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    active
                      ? "border-black bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-black hover:bg-slate-100",
                  )}
                >
                  {ROLE_TAB_LABEL[role]}
                </button>
              );
            })}
          </div>

          <div
            id={`personas-${activeRole}`}
            role="tabpanel"
            aria-label={`Persona vai trò ${ROLE_VI[activeRole]}`}
            className="mt-3 grid gap-2 sm:grid-cols-2"
          >
            {(personasByRole.get(activeRole) ?? []).map((p) => {
              const revealed = revealedId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePick(p)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-md border bg-slate-50 px-3 py-2 text-left text-sm transition-colors",
                    revealed
                      ? "border-black bg-white shadow-sm ring-1 ring-slate-300"
                      : "border-slate-200 hover:border-black hover:bg-white",
                  )}
                  aria-label={`Chọn persona ${p.displayName}`}
                >
                  <span className="font-medium text-slate-900">
                    {p.displayName}
                  </span>
                  {revealed ? (
                    <span className="space-y-0.5 font-mono text-xs leading-5 text-slate-700">
                      <div>
                        <span className="text-slate-500">Email: </span>
                        {p.email}
                      </div>
                      {hasPassword(p) ? (
                        <div>
                          <span className="text-slate-500">Mật khẩu: </span>
                          {p.password}
                        </div>
                      ) : (
                        <div className="italic text-slate-500">
                          Tự nhập mật khẩu khi đăng nhập
                        </div>
                      )}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">
                      Bấm để hiện thông tin đăng nhập
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400 uppercase tracking-tight">
            <a
              href="https://github.com/nguyentr02/UMS-HELPDESK-TICKET"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 transition-colors"
            >
              Technical Source: GitHub Repository
            </a>
            <span>© CAIRA-DAU</span>
          </div>
        </Card>
      </div>
    </>
  );
}
