import { z } from "zod";

/**
 * One schema is the single source of truth for every rule, in code and in
 * copy. The review step reads the same values, so nothing can drift.
 */

export const whoSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name — at least 2 characters.")
    .max(80, "That's longer than 80 characters; please check the entry.")
    .regex(
      /^[\p{L}\p{M}][\p{L}\p{M}'’.-]*(?:\s[\p{L}\p{M}'’.-]+)*$/u,
      "Letters, spaces, hyphens and apostrophes only."
    ),
  email: z
    .string()
    .trim()
    .min(1, "An email address is required — we send your membership card there.")
    .email("This doesn't look like an email address. Something like you@example.com."),
});

export const securitySchema = z.object({
  password: z
    .string()
    .min(12, "Use at least 12 characters — length beats complexity.")
    .max(128, "Passwords are capped at 128 characters."),
  confirmPassword: z.string().min(1, "Re-enter your password to confirm it."),
});

export type WhoValues = z.infer<typeof whoSchema>;
export type SecurityValues = z.infer<typeof securitySchema>;

/** Checklist the password meter shows, aligned with the schema rule. */
export const passwordCriteria: { label: string; test: (pw: string) => boolean }[] = [
  { label: "12 characters or more", test: (pw) => pw.length >= 12 },
  { label: "Upper and lower case", test: (pw) => /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
  { label: "A number", test: (pw) => /[0-9]/.test(pw) },
  { label: "A symbol", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export function passwordScore(pw: string): number {
  return passwordCriteria.filter((c) => c.test(pw)).length;
}

/** Flattens a ZodError into { path: message } for the error summary. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
