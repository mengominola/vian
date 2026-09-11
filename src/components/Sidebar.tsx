"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";
import ThemeToggle from "./ThemeToggle";
import { logout } from "@/lib/actions/auth";
import { socioColorVar, type SocioKey } from "@/lib/domain";

const ICONS: Record<string, React.ReactNode> = {
  expedientes: <path d="M3 6.5h6l2 2.5h10v11H3z" />,
  facturacion: (
    <>
      <path d="M6 3h9l3 3v15H6z" />
      <line x1="9" y1="10" x2="15" y2="10" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </>
  ),
  contabilidad: (
    <>
      <line x1="3" y1="20" x2="21" y2="20" />
      <path d="M6.5 20V13" />
      <path d="M12 20V7" />
      <path d="M17.5 20V16" />
    </>
  ),
  gastos: (
    <>
      <rect x="2" y="5" width="20" height="14" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </>
  ),
  ajustes: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
    </>
  ),
};

const NAV = [
  { href: "/expedientes", label: "Expedientes", icon: "expedientes" },
  { href: "/facturacion", label: "Facturación", icon: "facturacion" },
  { href: "/contabilidad", label: "Contabilidad", icon: "contabilidad" },
  { href: "/gastos", label: "Gastos", icon: "gastos" },
  { href: "/ajustes", label: "Ajustes", icon: "ajustes" },
];

export default function Sidebar({ user }: { user: { name: string; socio: SocioKey } }) {
  const pathname = usePathname();
  const initials = (user.name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

  return (
    <aside className={styles.aside}>
      <div className={styles.logo}>
        <span className={styles.logoText}>vian</span>
      </div>

      <nav className={styles.nav}>
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navitem} ${active ? styles.active : ""}`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                {ICONS[item.icon]}
              </svg>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.bottom}>
        <ThemeToggle />
        <div className={styles.userRow}>
          <div className={styles.avatar} style={{ color: socioColorVar(user.socio) }}>{initials}</div>
          <div style={{ lineHeight: 1.25, flex: 1, minWidth: 0 }}>
            <div className={styles.userName} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name || "—"}</div>
            <div className={styles.userRole} style={{ color: socioColorVar(user.socio) }}>{user.socio === "ana" ? "Ana" : "Jorge"}</div>
          </div>
          <form action={logout}>
            <button type="submit" title="Cerrar sesión" className={styles.logout} aria-label="Cerrar sesión">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
