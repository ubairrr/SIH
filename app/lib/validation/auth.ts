import { z } from "zod";

// Shared between the client form (react-hook-form + zodResolver) and the
// login Server Action (authoritative re-validation) — never trust client
// validation alone.
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
