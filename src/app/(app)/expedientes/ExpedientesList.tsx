"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ExpedienteDTO } from "@/lib/domain";
import { billedOf, isFinal, prioColor, PRIO_OPTION_BG } from "@/lib/domain";
import { money, yearOf } from "@/lib/format";
import {
  createExpediente,
  setEstado,
  setPrioridad,
  toggleSeguro,
} from "@/lib/actions/expedientes";

const GRID = "1.3fr 2.4fr 58px 54px .8fr 172px .8fr";
const YEARS = [2026, 2025, 2024];
const FILTERS: [string, string][] = [
  ["all", "Todos"],
  ["active", "Activos"],
  ["high", "Prioridad alta"],
  ["pendcobro", "Con pagos pendientes"],
  ["done", "Finalizados"],
];

export default function ExpedientesList({ expedientes }: { expedientes: ExpedienteDTO[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [items, setItems] = useState<ExpedienteDTO[]>(expedientes);
  const [year, setYear] = useState(2026);
  const [status, setStatus] = useState("active");
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  // Sincroniza con datos frescos del servidor tras revalidación/navegación.
  useEffect(() => setItems(expedientes), [expedientes]);

  const data = useMemo(
    () => items.filter((e) => yearOf(e.creado) === year),
    [items, year],
  );

  const kpi = useMemo(() => {
    const budget = data.reduce((s, e) => s + (e.presupuesto || 0), 0);
    const pending = data.reduce((s, e) => {
      if (e.presupuesto === null || e.presupuesto === undefined) return s;
      return s + Math.max(e.presupuesto - billedOf(e.pagos), 0);
    }, 0);
    const high = data.filter((e) => !isFinal(e.estado) && (e.prioridad === 1 || e.prioridad === 2)).length;
    const done = data.filter((e) => isFinal(e.estado)).length;
    return { budget, pending, high, done };
  }, [data]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const stMatch = (e: ExpedienteDTO) => {
      const fin = isFinal(e.estado);
      switch (status) {
        case "active": return !fin;
        case "done": return fin;
        case "high": return !fin && (e.prioridad === 1 || e.prioridad === 2);
        case "pendcobro": return e.pagos.some((pg) => !pg.cobrado);
        default: return true;
      }
    };
    const filtered = data.filter(stMatch).filter((e) => {
      if (!q) return true;
      return e.name.toLowerCase().includes(q) || (e.estado || "").toLowerCase().includes(q);
    });
    return filtered.sort((a, b) =>
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );
  }, [data, status, search, sortAsc]);

  // Mutaciones locales optimistas + persistencia
  const patchLocal = (id: string, patch: Partial<ExpedienteDTO>) =>
    setItems((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const onEstadoChange = (id: string, v: string) => patchLocal(id, { estado: v });
  const onEstadoBlur = (id: string, v: string) => startTransition(() => { void setEstado(id, v); });
  const onToggleSeguro = (id: string, current: boolean) => {
    patchLocal(id, { seguro: !current });
    startTransition(() => { void toggleSeguro(id); });
  };
  const onPrioridad = (id: string, v: string) => {
    const p = v ? parseInt(v, 10) : null;
    patchLocal(id, { prioridad: p });
    startTransition(() => { void setPrioridad(id, p); });
  };

  const onNew = () =>
    startTransition(async () => {
      const id = await createExpediente();
      router.push(`/expedientes/${id}?nuevo=1`);
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Cabecera fija */}
      <div style={{ flex: "none", padding: "28px 34px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.01em" }}>Expedientes</div>
            <div style={{ fontSize: 12.5, color: "var(--mut)", marginTop: 4 }}>
              {data.length} expedientes · {kpi.done} finalizados
            </div>
          </div>
          <div
            className="rowh"
            onClick={onNew}
            style={{ background: "var(--accent)", color: "#fff", fontSize: 12.5, fontWeight: 600, padding: "10px 17px", cursor: "pointer", userSelect: "none" }}
          >
            + Nuevo expediente
          </div>
        </div>

        {/* Pestañas de año */}
        <div style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--border)" }}>
          {YEARS.map((y) => (
            <div
              key={y}
              onClick={() => setYear(y)}
              style={{
                cursor: "pointer", fontSize: 13, fontWeight: 600,
                color: year === y ? "#fff" : "var(--mut2)",
                padding: "0 0 12px", borderBottom: `2px solid ${year === y ? "var(--accent)" : "transparent"}`,
                marginBottom: -1,
              }}
            >
              {y}
            </div>
          ))}
        </div>

        {/* KPIs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
          <KpiCell label="Presupuestado" value={money(kpi.budget)} />
          <KpiCell label="Pendiente de cobro" value={money(kpi.pending)} />
          <KpiCell label="Prioridad alta" value={String(kpi.high)} color="var(--accent)" />
          <KpiCell label="Finalizados" value={String(kpi.done)} color="var(--mut2)" last />
        </div>

        {/* Búsqueda + filtros */}
        <div style={{ display: "flex", alignItems: "center", gap: 26, padding: "18px 0 16px" }}>
          <div style={{ flex: "none", width: 300, border: "1px solid var(--border2)", background: "var(--deep)", padding: "9px 12px", display: "flex", alignItems: "center", gap: 9 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--mut3)" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar expediente o estado"
              style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: "var(--text)", width: "100%" }}
            />
          </div>
          <div style={{ display: "flex", gap: 22, fontSize: 12.5, letterSpacing: "0.03em" }}>
            {FILTERS.map(([key, label]) => (
              <span
                key={key}
                onClick={() => setStatus(key)}
                style={{ cursor: "pointer", color: status === key ? "#fff" : "var(--mut2)", fontWeight: status === key ? 600 : 400 }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Cabecera de tabla */}
        <div style={{ display: "grid", gridTemplateColumns: GRID, alignItems: "center", padding: "10px 12px", fontSize: 10, letterSpacing: "0.07em", color: "var(--mut2)", textTransform: "uppercase", borderBottom: "1px solid var(--border2)" }}>
          <div onClick={() => setSortAsc((v) => !v)} style={{ cursor: "pointer", display: "inline-flex", gap: 4, alignItems: "center", color: "var(--text3)" }}>
            Expediente <span>{sortAsc ? "↑" : "↓"}</span>
          </div>
          <div>Estado</div>
          <div style={{ textAlign: "center" }}>Seguro</div>
          <div style={{ textAlign: "center" }}>Prior.</div>
          <div style={{ textAlign: "right" }}>Presupuesto</div>
          <div style={{ textAlign: "left", paddingLeft: 16 }}>Pagos</div>
          <div style={{ textAlign: "right" }}>Pendiente</div>
        </div>
      </div>

      {/* Cuerpo scrollable */}
      <div className="tablescroll" style={{ flex: 1, overflow: "auto", padding: "0 34px 24px" }}>
        {rows.map((e) => {
          const fin = isFinal(e.estado);
          const billed = billedOf(e.pagos);
          const pend = (e.presupuesto || 0) - billed;
          const hasBudget = e.presupuesto !== null && e.presupuesto !== undefined;
          const chips = e.pagos
            .slice()
            .sort((a, b) => {
              if (!a.fecha && !b.fecha) return 0;
              if (!a.fecha) return 1;
              if (!b.fecha) return -1;
              return a.fecha.localeCompare(b.fecha);
            });
          return (
            <div
              key={e.id}
              className="rowh"
              onClick={() => router.push(`/expedientes/${e.id}`)}
              style={{ display: "grid", gridTemplateColumns: GRID, alignItems: "center", padding: "9px 12px", fontSize: 13, background: fin ? "var(--panel)" : "transparent", borderBottom: "1px solid var(--line)", cursor: "pointer" }}
            >
              <div style={{ fontWeight: 600, color: fin ? "var(--mut2)" : "var(--text)" }}>{e.name || "—"}</div>

              <div onClick={(ev) => ev.stopPropagation()}>
                <input
                  className="estado-input num"
                  value={e.estado || ""}
                  onChange={(ev) => onEstadoChange(e.id, ev.target.value)}
                  onBlur={(ev) => onEstadoBlur(e.id, ev.target.value)}
                  placeholder="Añadir nota…"
                  style={{ width: "100%", fontSize: 12.5, color: fin ? "var(--mut5)" : "var(--text2)", padding: "6px 9px", fontStyle: fin ? "italic" : "normal", fontVariantNumeric: "normal" }}
                />
              </div>

              <div
                onClick={(ev) => { ev.stopPropagation(); onToggleSeguro(e.id, e.seguro); }}
                title={e.seguro ? "Dado de alta en el seguro" : "Sin alta en seguro — clic para marcar"}
                style={{ display: "flex", justifyContent: "center", cursor: "pointer" }}
              >
                {e.seguro ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, color: "var(--ana)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                ) : (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, color: "var(--accent)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l9 16H3z" /><line x1="12" y1="9.5" x2="12" y2="14" /><circle cx="12" cy="16.6" r="0.3" fill="currentColor" stroke="none" /></svg>
                  </span>
                )}
              </div>

              <div onClick={(ev) => ev.stopPropagation()} style={{ display: "flex", justifyContent: "center" }}>
                <select
                  className="flatselect"
                  value={e.prioridad ?? ""}
                  onChange={(ev) => onPrioridad(e.id, ev.target.value)}
                  disabled={fin}
                  style={{ width: 24, height: 22, textAlign: "center", textAlignLast: "center", border: "none", fontSize: 12.5, fontWeight: 700, color: e.prioridad ? prioColor(e.prioridad) : "var(--mut2)", background: "transparent", cursor: fin ? "default" : "pointer" }}
                >
                  <option value="" style={{ background: "var(--panel)", color: "var(--text3)" }}>—</option>
                  {[1, 2, 3, 4, 5].map((p) => (
                    <option key={p} value={p} style={{ background: PRIO_OPTION_BG[p], color: "#141414" }}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="num nowrap" style={{ textAlign: "right", fontWeight: 600, fontSize: 12.5, color: fin ? "var(--mut5)" : "var(--text2)" }}>{money(e.presupuesto)}</div>

              <div onClick={(ev) => ev.stopPropagation()} style={{ display: "grid", gridTemplateColumns: "repeat(6, 22px)", gap: 4, alignItems: "center", justifyContent: "start", paddingLeft: 16 }}>
                {chips.map((pg, i) => (
                  <span
                    key={pg.id}
                    title={pg.cobrado ? `Pago ${i + 1} · cobrado` : `Pago ${i + 1} · no cobrado`}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 20, background: pg.cobrado ? "rgba(92,191,152,0.22)" : "rgba(232,85,103,0.22)", color: pg.cobrado ? "var(--ana)" : "#e8879a", fontSize: 9, fontWeight: 700 }}
                  >
                    P{i + 1}
                  </span>
                ))}
              </div>

              <div className="num nowrap" style={{ textAlign: "right", fontWeight: 600, fontSize: 12.5, color: fin ? "var(--mut5)" : hasBudget && pend > 0.5 ? "var(--text)" : "var(--mut5)" }}>
                {hasBudget ? money(pend) : "—"}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", fontSize: 13, color: "var(--mut3)" }}>
            Ningún expediente coincide con el filtro.
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCell({ label, value, color, last }: { label: string; value: string; color?: string; last?: boolean }) {
  return (
    <div style={{ flex: 1, padding: "16px 20px", borderRight: last ? "none" : "1px solid var(--border)" }}>
      <div style={{ fontSize: 10.5, letterSpacing: "0.07em", color: "var(--mut)", textTransform: "uppercase" }}>{label}</div>
      <div className="num" style={{ fontSize: 23, fontWeight: 700, marginTop: 7, color: color ?? "var(--text)" }}>{value}</div>
    </div>
  );
}
