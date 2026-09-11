"use client";

import { useMemo, useState } from "react";
import type { ExpedienteDTO, GastoDTO, SocioKey } from "@/lib/domain";
import { socioKey, socioName, socioColorVar } from "@/lib/domain";
import { money, fmtDMY, yearOf, monthOf, MONTH_NAMES } from "@/lib/format";

const GRID = "minmax(120px,250px) 88px 58px minmax(80px,1fr) 54px 90px 90px 90px";
const YEARS = [2026, 2025, 2024];

interface AcctRow {
  month: number;
  name: string;
  fecha: string;
  numPago: string;
  imp: number;
  socioK: SocioKey;
  emp: number;
  s1: number;
  s2: number;
  empAmt: number;
  s1Amt: number;
  s2Amt: number;
}

const pagoSort = (a: { fecha: string | null }, b: { fecha: string | null }) => {
  if (!a.fecha && !b.fecha) return 0;
  if (!a.fecha) return 1;
  if (!b.fecha) return -1;
  return a.fecha.localeCompare(b.fecha);
};

export default function Contabilidad({ expedientes, gastos }: { expedientes: ExpedienteDTO[]; gastos: GastoDTO[] }) {
  const [acctYear, setAcctYear] = useState(2026);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const model = useMemo(() => {
    const acctPagos: AcctRow[] = [];
    let balAna = 0;
    let balJorge = 0;
    expedientes.forEach((e) => {
      const sorted = e.pagos.slice().sort(pagoSort);
      sorted.forEach((pg, i) => {
        if (!pg.cobrado || !pg.fecha) return;
        if (yearOf(pg.fecha) !== acctYear) return;
        const imp = Number(pg.importe) || 0;
        const socioK = socioKey(pg.facturaPor ?? "socio1");
        if (socioK === "ana") balAna += imp;
        else balJorge += imp;
        acctPagos.push({
          month: monthOf(pg.fecha) ?? 0,
          name: e.name,
          fecha: fmtDMY(pg.fecha),
          numPago: "P" + (i + 1),
          imp,
          socioK,
          emp: pg.emp || 0,
          s1: pg.s1 || 0,
          s2: pg.s2 || 0,
          empAmt: (imp * (pg.emp || 0)) / 100,
          s1Amt: (imp * (pg.s1 || 0)) / 100,
          s2Amt: (imp * (pg.s2 || 0)) / 100,
        });
      });
    });

    const now = new Date();
    const months = [] as {
      m: number; key: string; label: string; count: string; rows: AcctRow[];
      totalStr: string; sinEmpStr: string; sinAnaStr: string; sinJorStr: string;
      gEmpStr: string; gAnaStr: string; gJorStr: string; conEmpStr: string; conAnaStr: string; conJorStr: string;
      defCollapsed: boolean;
    }[];
    for (let m = 11; m >= 0; m--) {
      const rows = acctPagos.filter((p) => p.month === m);
      if (rows.length === 0) continue;
      const tot = rows.reduce((s, r) => s + r.imp, 0);
      const tEmp = rows.reduce((s, r) => s + r.empAmt, 0);
      const tS1 = rows.reduce((s, r) => s + r.s1Amt, 0);
      const tS2 = rows.reduce((s, r) => s + r.s2Amt, 0);
      const mg = gastos.filter((g) => yearOf(g.fecha) === acctYear && monthOf(g.fecha) === m && !g.compensado && !g.noComputable);
      const gEmp = mg.filter((g) => g.entidad === "empresa").reduce((s, g) => s + (Number(g.importe) || 0), 0);
      const gAna = mg.filter((g) => g.entidad === "socio1").reduce((s, g) => s + (Number(g.importe) || 0), 0);
      const gJor = mg.filter((g) => g.entidad === "socio2").reduce((s, g) => s + (Number(g.importe) || 0), 0);
      const netEmp = tEmp - gEmp;
      const netAna = tS1 + gAna;
      const netJor = tS2 + gJor;
      months.push({
        m,
        key: `${acctYear}-${m}`,
        label: `${MONTH_NAMES[m]} ${acctYear}`,
        count: rows.length + (rows.length === 1 ? " pago" : " pagos"),
        rows,
        totalStr: money(tot),
        sinEmpStr: money(tEmp), sinAnaStr: money(tS1), sinJorStr: money(tS2),
        gEmpStr: gEmp > 0 ? "− " + money(gEmp) : money(0),
        gAnaStr: gAna > 0 ? "+ " + money(gAna) : money(0),
        gJorStr: gJor > 0 ? "+ " + money(gJor) : money(0),
        conEmpStr: money(netEmp), conAnaStr: money(netAna), conJorStr: money(netJor),
        defCollapsed: !(acctYear === now.getFullYear() && m === now.getMonth()),
      });
    }
    const balDiff = balAna - balJorge;
    const totalBal = balAna + balJorge;
    return {
      months,
      empty: months.length === 0,
      balAna, balJorge,
      diffStr: balDiff === 0 ? "Equilibrado" : balDiff > 0 ? "Ana +" + money(Math.abs(balDiff)) : "Jorge +" + money(Math.abs(balDiff)),
      diffFg: balDiff === 0 ? "var(--mut2)" : balDiff > 0 ? "var(--ana)" : "var(--jorge)",
      anaW: totalBal > 0 ? `${(balAna / totalBal) * 100}%` : "50%",
      jorgeW: totalBal > 0 ? `${(balJorge / totalBal) * 100}%` : "50%",
    };
  }, [expedientes, gastos, acctYear]);

  const isCollapsed = (key: string, def: boolean) => (key in collapsed ? collapsed[key] : def);
  const toggle = (key: string, def: boolean) => setCollapsed((c) => ({ ...c, [key]: !isCollapsed(key, def) }));

  const anaBg = "var(--ana-bg)";
  const jorgeBg = "var(--jorge-bg)";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ flex: "none", padding: "26px 40px 0" }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em" }}>Contabilidad</div>
        <div style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--border)", marginTop: 16 }}>
          {YEARS.map((y) => (
            <div key={y} onClick={() => setAcctYear(y)} style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: acctYear === y ? "#fff" : "var(--mut2)", padding: "0 0 12px", borderBottom: `2px solid ${acctYear === y ? "var(--accent)" : "transparent"}`, marginBottom: -1 }}>{y}</div>
          ))}
        </div>

        {/* Balance por socio */}
        <div style={{ padding: "22px 0 24px" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.07em", color: "var(--mut2)", textTransform: "uppercase", marginBottom: 14 }}>Facturado por socio</div>
          <div style={{ display: "flex", gap: 48, alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 12.5, color: "var(--ana)", fontWeight: 600, marginBottom: 4 }}>Ana</div>
              <div className="num" style={{ fontSize: 26, fontWeight: 700 }}>{money(model.balAna)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12.5, color: "var(--jorge)", fontWeight: 600, marginBottom: 4 }}>Jorge</div>
              <div className="num" style={{ fontSize: 26, fontWeight: 700 }}>{money(model.balJorge)}</div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.07em", color: "var(--mut2)", textTransform: "uppercase", marginBottom: 4 }}>Balance</div>
              <div className="num" style={{ fontSize: 15, fontWeight: 700, color: model.diffFg }}>{model.diffStr}</div>
            </div>
          </div>
          <div style={{ display: "flex", height: 5, marginTop: 16, background: "var(--bar)" }}>
            <div style={{ width: model.anaW, background: "var(--ana)" }} />
            <div style={{ width: model.jorgeW, background: "var(--jorge)" }} />
          </div>
        </div>
      </div>

      <div className="tablescroll" style={{ flex: 1, overflow: "auto", padding: "0 40px 40px" }}>
        {model.empty && <div style={{ border: "1px solid var(--border)", padding: 50, textAlign: "center", color: "var(--mut3)", fontSize: 13 }}>No hay pagos cobrados en este año.</div>}
        {model.months.map((m) => {
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
                  {/* cabecera de columnas */}
                  <div style={{ display: "grid", gridTemplateColumns: GRID, alignItems: "center", padding: "11px 0 9px", fontSize: 9.5, letterSpacing: "0.06em", color: "var(--mut2)", textTransform: "uppercase", borderBottom: "1px solid var(--line)" }}>
                    <div style={{ paddingLeft: 14 }}>Expediente</div>
                    <div style={{ textAlign: "center" }}>Fecha</div>
                    <div style={{ textAlign: "center" }}>Pago</div>
                    <div style={{ textAlign: "right", paddingRight: 14 }}>Importe</div>
                    <div style={{ paddingLeft: 12 }}>Factura</div>
                    <div style={{ textAlign: "right", paddingRight: 12, background: "var(--boxemp)" }}>Empresa</div>
                    <div style={{ textAlign: "right", paddingRight: 12, background: anaBg, color: "var(--ana)" }}>Ana</div>
                    <div style={{ textAlign: "right", paddingRight: 12, background: jorgeBg, color: "var(--jorge)" }}>Jorge</div>
                  </div>

                  {m.rows.map((r, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: GRID, alignItems: "center", fontSize: 13, borderBottom: "1px solid var(--line2)" }}>
                      <div style={{ padding: "14px 10px 14px 14px", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
                      <div className="num" style={{ textAlign: "center", color: "var(--text3b)", fontSize: 12 }}>{r.fecha}</div>
                      <div style={{ textAlign: "center", color: "var(--text3b)", fontSize: 12 }}>{r.numPago}</div>
                      <div className="num nowrap" style={{ textAlign: "right", paddingRight: 14, fontSize: 15, fontWeight: 700 }}>{money(r.imp)}</div>
                      <div style={{ paddingLeft: 12, color: socioColorVar(r.socioK), fontWeight: 600, fontSize: 12 }}>{socioName(r.socioK)}</div>
                      <div className="num" style={{ textAlign: "right", paddingRight: 12, color: "var(--text3b)", alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "flex-end", background: "var(--boxemp)" }}>{r.emp}%</div>
                      <div className="num" style={{ textAlign: "right", paddingRight: 12, color: "var(--ana)", alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "flex-end", background: anaBg }}>{r.s1}%</div>
                      <div className="num" style={{ textAlign: "right", paddingRight: 12, color: "var(--jorge)", alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "flex-end", background: jorgeBg }}>{r.s2}%</div>
                    </div>
                  ))}

                  {/* totales */}
                  <div style={{ background: "var(--deep)", borderTop: "2px solid var(--scroll)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: GRID, alignItems: "stretch", fontSize: 12.5, paddingTop: 4 }}>
                      <div style={{ padding: "9px 0 9px 14px", fontSize: 10, letterSpacing: "0.06em", color: "var(--mut)", textTransform: "uppercase", alignSelf: "center" }}>Total sin gastos</div>
                      <div /><div /><div /><div />
                      <TotCell value={m.sinEmpStr} bg="var(--boxrow)" color="var(--text2)" />
                      <TotCell value={m.sinAnaStr} bg={anaBg} color="var(--ana)" />
                      <TotCell value={m.sinJorStr} bg={jorgeBg} color="var(--jorge)" />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: GRID, alignItems: "stretch", fontSize: 12.5 }}>
                      <div style={{ padding: "9px 0 9px 14px", fontSize: 10, letterSpacing: "0.06em", color: "var(--mut)", textTransform: "uppercase", alignSelf: "center" }}>Gastos</div>
                      <div /><div /><div /><div />
                      <TotCell value={m.gEmpStr} bg="var(--boxrow)" color="#d98a94" />
                      <TotCell value={m.gAnaStr} bg={anaBg} color="var(--ana)" />
                      <TotCell value={m.gJorStr} bg={jorgeBg} color="var(--jorge)" />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: GRID, alignItems: "stretch", fontSize: 13, borderTop: "1px solid var(--border2)", paddingBottom: 4 }}>
                      <div style={{ padding: "13px 0 13px 14px", fontSize: 11, letterSpacing: "0.07em", color: "var(--text)", textTransform: "uppercase", fontWeight: 700, alignSelf: "center" }}>Total con gastos</div>
                      <div /><div />
                      <div className="num nowrap" style={{ textAlign: "right", paddingRight: 14, fontWeight: 700, fontSize: 17, alignSelf: "center" }}>{m.totalStr}</div>
                      <div />
                      <TotCell value={m.conEmpStr} bg="var(--boxrow)" color="var(--text2)" bold />
                      <TotCell value={m.conAnaStr} bg={anaBg} color="var(--ana)" bold />
                      <TotCell value={m.conJorStr} bg={jorgeBg} color="var(--jorge)" bold />
                    </div>
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

function TotCell({ value, bg, color, bold }: { value: string; bg: string; color: string; bold?: boolean }) {
  return (
    <div className="num nowrap" style={{ textAlign: "right", padding: bold ? "13px 6px" : "9px 6px", color, background: bg, fontWeight: bold ? 700 : undefined, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
      {value}
    </div>
  );
}
