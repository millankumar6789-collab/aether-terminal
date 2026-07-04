"use client";

import { AuthProvider } from "./auth-provider";

/** Root client-side providers tree. */
export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
