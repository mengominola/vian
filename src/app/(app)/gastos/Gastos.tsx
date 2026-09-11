"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { GastoDTO, EntidadGasto } from "@/lib/domain";
import { money, moneyPlain, parseMoney, yearOf, monthOf, MONTH_NAMES, todayISO } from "@/lib/format";
import { addGasto, updateGasto, deleteGasto } from "@/lib/actions/gastos";

const GRID = "minmax(140px,1fr) 128px 104px 110px 96px 100px 32px";
const YEARS = [2026, 2025, 2024];

export default function Gastos({ gastos }: { gastos: GastoDTO[] }) {
  const [, startTransition] = useTransition();
  const [items, setItems] = useState<GastoDTO[]>(gastos);
  const [year, setYear] = useState(2026);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [raw, setRaw] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState({ concepto: "", importe: "", fecha: "", entidad: "empresa" as EntidadGasto });
  const [error, setError] = useState(false);

  useEffect(() => setItems(gastos), [gastos]);

  const persist = (fn: () => Promise<unknown>) => startTransition(() => { void fn(); });
  const patchLocal = (id: string, p: Partial<GastoDTO>) => setItems((prev) => prev.map((g) => (g.id === id ? { ...g, ...p } : g)));

  const months = useMemo(() => {
    const now = new Date();
    const inYear = items.filter((g) => yearOf(g.fecha) === year);
    const out: { m: number; key: string; label: string; count: string; rows: GastoDTO[]; totalStr: string; defCollapsed: boolean }[] = [];
    for (let m = 11; m >= 0; m--) {
      const rows = inYear.filter((g) => monthOf(g.fecha) === m).sort((a, b) => a.fecha.localeCompare(b.fecha));
      if (rows.length === 0) continue;
      const tot = rows.reduce((s, g) => s + (Number(g.importe) || 0), 0);
      out.push({
        m,
        key: `${year}-${m}`,
        label: `${MONTH_NAMES[m]} ${year}`,
        count: rows.length + (rows.length === 1 ? " gasto" : " gastos"),
        rows,
        totalStr: money(tot),
        defCollapsed: !(year === now.getFullYear() && m === now.getMonth()),
      });
    }
    return out;
  }, [items, year]);

  const isCollapsed = (key: string, def: boolean) => (key in collapsed ? collapsed[key] : def);
  const toggle = (key: string, def: boolean) => setCollapsed((c) => ({ ...c, [key]: !isCollapsed(key, def) }));

  const onAdd = () => {
    const imp = parseMoney(draft.importe);
    if (!draft.concepto.trim() || !draft.fecha || !(imp > 0)) { setError(true); return; }
    setError(false);
    const y = yearOf(draft.fecha);
    if (y) setYear(y);
    const entidad = draft.entidad;
    persist(async () => { await addGasto({ concepto: draft.concepto.trim(), importe: imp, fecha: draft.fecha, entidad }); });
    setDraft({ concepto: "", importe: "", fecha: "", entidad });
  };

  const grow: React.CSSProperties = { width: "100%" };
  const micro: React.CSSProperties = { fontSize: 9.5, letterSpacing: "0.06em", color: "var(--mut2)", textTransform: "uppercase", marginBottom: 5 };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ flex: "none", padding: "26px 40px 0" }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em" }}>Gastos</div>
        <div style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--border)", marginTop: 16 }}>
          {YEARS.map((y) => (
            <div key={y} onClick={() => setYear(y)} style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: year === y ? "#fff" : "var(--mut2)", padding: "0 0 12px", borderBottom: `2px solid ${year === y ? "var(--accent)" : "transparent"}`, marginBottom: -1 }}>{y}</div>
          ))}
        </div>

        {/* Añadir gasto */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, padding: "20px 0 22px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={micro}>Concepto</div>
            <input className="gfield" value={draft.concepto} onChange={(e) => { setDraft((d) => ({ ...d, concepto: e.target.value })); setError(false); }} placeholder="Descripción del gasto" style={{ width: "100%", padding: "9px 11px", fontSize: 13 }} />
          </div>
          <div style={{ width: 130 }}>
            <div style={micro}>Importe</div>
            <input className="gfield num" value={draft.importe} onChange={(e) => { setDraft((d) => ({ ...d, importe: e.target.value })); setError(false); }} inputMode="decimal" placeholder="0,00 €" style={{ width: "100%", padding: "9px 11px", fontSize: 13, textAlign: "right" }} />
          </div>
          <div style={{ width: 150 }}>
            <div style={micro}>Fecha</div>
            <input className="gfield num" type="date" value={draft.fecha} onChange={(e) => { setDraft((d) => ({ ...d, fecha: e.target.value })); setError(false); }} style={{ width: "100%", padding: "8px 11px", fontSize: 13 }} />
          </div>
          <div style={{ width: 130 }}>
            <div style={micro}>Asume</div>
            <select className="flatselect gfield" value={draft.entidad} onChange={(e) => setDraft((d) => ({ ...d, entidad: e.target.value as EntidadGasto }))} style={{ width: "100%", padding: "9px 11px", fontSize: 13 }}>
              <option value="empresa" style={{ background: "var(--panel)", color: "var(--text)" }}>Empresa</option>
              <option value="socio1" style={{ background: "var(--panel)", color: "var(--text)" }}>Ana</option>
              <option value="socio2" style={{ background: "var(--panel)", color: "var(--text)" }}>Jorge</option>
            </select>
          </div>
          <div onClick={onAdd} className="rowh" style={{ cursor: "pointer", background: "var(--accent)", color: "#fff", fontSize: 12.5, fontWeight: 600, padding: "10px 18px", whiteSpace: "nowrap" }}>+ Añadir</div>
        </div>
        {error && <div style={{ fontSize: 11.5, color: "var(--accent)", margin: "-12px 0 14px" }}>Completa concepto, importe y fecha para añadir el gasto.</div>}
      </div>

      <div className="tablescroll" style={{ flex: 1, overflow: "auto", padding: "0 40px 40px" }}>
        {months.length === 0 && <div style={{ border: "1px solid var(--border)", padding: 50, textAlign: "center", color: "var(--mut3)", fontSize: 13 }}>No hay gastos registrados en este año.</div>}
        {months.map((m) => {
          const col = isCollapsed(m.key, m.defCollapsed);
          return (
            <div key={m.key} style={{ marginBottom: 26 }}>
              <div onClick={() => toggle(m.key, m.defCollapsed)} className="navitem" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: col ? "var(--hover)" : "var(--hdropen)" }}>
                <span style={{ fontSize: 16, color: col ? "var(--mut4)" : "var(--mut)", width: 10, lineHeight: 1 }}>{col ? "›" : "‹"}</span>
                <div style={{ fontSize: 15, fontWeight: 700, color: col ? "var(--mut)" : "var(--text)" }}>{m.label}</div>
                <div style={{ fontSize: 11, color: col ? "var(--mut4)" : "var(--mut)" }}>{m.count}</div>
                <div className="num nowrap" style={{ marginLeft: "auto", fontSize: 14, fontWeight: 700, color: col ? "var(--mut)" : "var(--text)" }}>{m.totalStr}</div>
              </div>

              {!col && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: GRID, alignItems: "center", padding: "11px 0 9px", fontSize: 9.5, letterSpacing: "0.06em", color: "var(--mut2)", textTransform: "uppercase", borderBottom: "1px solid var(--line)" }}>
                    <div style={{ paddingLeft: 14 }}>Concepto</div>
                    <div style={{ textAlign: "center" }}>Fecha</div>
                    <div>Asume</div>
                    <div style={{ textAlign: "right", paddingRight: 14 }}>Importe</div>
                    <div style={{ textAlign: "center" }}>Compensado</div>
                    <div style={{ textAlign: "center" }}>No computable</div>
                    <div />
                  </div>

                  {m.rows.map((g) => {
                    const impKey = "g:" + g.id;
                    return (
                      <div key={g.id} style={{ display: "grid", gridTemplateColumns: GRID, alignItems: "center", fontSize: 13, borderBottom: "1px solid var(--line2)", opacity: g.compensado || g.noComputable ? 0.45 : 1 }}>
                        <div style={{ padding: "7px 10px", minWidth: 0 }}>
                          <input className="grow" value={g.concepto} onChange={(e) => patchLocal(g.id, { concepto: e.target.value })} onBlur={(e) => persist(async () => { await updateGasto(g.id, { concepto: e.target.value }); })} style={{ ...grow, padding: "8px 9px", fontSize: 13 }} />
                        </div>
                        <div style={{ padding: "0 6px" }}>
                          <input className="grow num" type="date" value={g.fecha} onChange={(e) => { if (e.target.value) { patchLocal(g.id, { fecha: e.target.value }); persist(async () => { await updateGasto(g.id, { fecha: e.target.value }); }); } }} style={{ ...grow, padding: "7px 8px", fontSize: 12 }} />
                        </div>
                        <div style={{ padding: "0 6px 0 0" }}>
                          <select className="flatselect grow" value={g.entidad} onChange={(e) => { const v = e.target.value as EntidadGasto; patchLocal(g.id, { entidad: v }); persist(async () => { await updateGasto(g.id, { entidad: v }); }); }} style={{ ...grow, padding: "8px 9px", fontSize: 12 }}>
                            <option value="empresa" style={{ background: "var(--panel)", color: "var(--text)" }}>Empresa</option>
                            <option value="socio1" style={{ background: "var(--panel)", color: "var(--text)" }}>Ana</option>
                            <option value="socio2" style={{ background: "var(--panel)", color: "var(--text)" }}>Jorge</option>
                          </select>
                        </div>
                        <div style={{ padding: "0 6px" }}>
                          <input
                            className="grow num"
                            value={raw[impKey] ?? moneyPlain(g.importe)}
                            onChange={(e) => { setRaw((r) => ({ ...r, [impKey]: e.target.value })); patchLocal(g.id, { importe: parseMoney(e.target.value) }); }}
                            onBlur={(e) => { const v = parseMoney(e.target.value); setRaw((r) => { const { [impKey]: _o, ...rest } = r; void _o; return rest; }); persist(async () => { await updateGasto(g.id, { importe: v }); }); }}
                            inputMode="decimal"
                            style={{ ...grow, padding: "8px 9px", fontSize: 15, fontWeight: 700, textAlign: "right" }}
                          />
                        </div>
                        <Check on={g.compensado} onClick={() => { const v = !g.compensado; patchLocal(g.id, { compensado: v }); persist(async () => { await updateGasto(g.id, { compensado: v }); }); }} />
                        <Check on={g.noComputable} onClick={() => { const v = !g.noComputable; patchLocal(g.id, { noComputable: v }); persist(async () => { await updateGasto(g.id, { noComputable: v }); }); }} />
                        <div onClick={() => { patchLocal(g.id, {}); setItems((prev) => prev.filter((x) => x.id !== g.id)); persist(async () => { await deleteGasto(g.id); }); }} style={{ textAlign: "center", cursor: "pointer", color: "var(--mut3)", fontSize: 16 }}>×</div>
                      </div>
                    );
                  })}

                  <div style={{ display: "grid", gridTemplateColumns: GRID, alignItems: "center", fontSize: 13, borderTop: "2px solid var(--scroll)", background: "var(--deep)" }}>
                    <div style={{ padding: "14px 0 14px 14px", fontSize: 11, letterSpacing: "0.07em", color: "var(--text2)", textTransform: "uppercase", fontWeight: 700 }}>Total mes</div>
                    <div /><div />
                    <div className="num nowrap" style={{ textAlign: "right", paddingRight: 14, fontWeight: 700, fontSize: 17 }}>{m.totalStr}</div>
                    <div /><div /><div />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Check({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
      <span style={{ width: 16, height: 16, flex: "none", background: on ? "var(--accent)" : "transparent", boxShadow: `inset 0 0 0 1.5px ${on ? "var(--accent)" : "var(--mut10)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {on && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12" /></svg>}
      </span>
    </div>
  );
}
