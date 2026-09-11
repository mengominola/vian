"use client";

import { useActionState } from "react";
import { authenticate } from "@/lib/actions/auth";

export default function LoginForm() {
  const [error, formAction, pending] = useActionState(authenticate, undefined);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
      <form action={formAction} style={{ width: 320, maxWidth: "100%" }}>
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--accent)", lineHeight: 1, marginBottom: 6 }}>vian</div>
        <div style={{ fontSize: 12.5, color: "var(--mut)", marginBottom: 26 }}>Contabilidad y expedientes</div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9.5, letterSpacing: "0.06em", color: "var(--mut2)", textTransform: "uppercase", marginBottom: 5 }}>Email</div>
          <input name="email" type="email" autoComplete="username" required className="editfield" style={{ width: "100%", fontSize: 13, padding: "9px 11px" }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 9.5, letterSpacing: "0.06em", color: "var(--mut2)", textTransform: "uppercase", marginBottom: 5 }}>Contraseña</div>
          <input name="password" type="password" autoComplete="current-password" required className="editfield" style={{ width: "100%", fontSize: 13, padding: "9px 11px" }} />
        </div>

        {error && <div style={{ fontSize: 12, color: "var(--accent)", marginBottom: 14 }}>{error}</div>}

        <button type="submit" disabled={pending} className="rowh" style={{ width: "100%", border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 600, padding: "11px 0", cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}>
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
