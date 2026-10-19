/* ═══════════════════════════════════════════════════════════
 * AUTH CONTEXT
 * User context provider + useAuth hook
 * ═══════════════════════════════════════════════════════════ */
import React, { createContext, useContext } from "react";

/* ⭐ Context — مع قيمة افتراضية آمنة */
export const AuthCtx = createContext({
  user: null,
  can: () => false,
});

/* ⭐ Provider */
export function AuthProvider({ user = null, can = () => false, children }) {
  return <AuthCtx.Provider value={{ user, can }}>{children}</AuthCtx.Provider>;
}

/* ⭐ Hook — آمن دائماً */
export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  return ctx || { user: null, can: () => false };
};
