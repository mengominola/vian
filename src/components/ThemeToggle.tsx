"use client";

import { useEffect, useState } from "react";
import styles from "./Sidebar.module.css";

type Theme = "dark" | "light";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  // Sincroniza con lo que el script de arranque puso en <html>.
  useEffect(() => {
    const t = document.documentElement.getAttribute("data-theme");
    if (t === "light" || t === "dark") setTheme(t);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("vian_theme", next);
    } catch {}
  };

  const isLight = theme === "light";

  return (
    <div className={styles.navitem} onClick={toggle} role="button" tabIndex={0} style={{ color: "var(--mut)" }}>
      {isLight ? (
        // En claro, ofrecer volver a oscuro (icono luna)
        <>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          </svg>
          <span>Tema oscuro</span>
        </>
      ) : (
        // En oscuro, ofrecer tema claro (icono sol)
        <>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
          </svg>
          <span>Tema claro</span>
        </>
      )}
    </div>
  );
}
