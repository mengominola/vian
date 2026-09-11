"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FacturaDTO, EstadoFactura, SocioKey } from "@/lib/domain";
import { facturaTotal, socioColorVar, socioName } from "@/lib/domain";
import { money, fmtDMY, yearOf } from "@/lib/format";
import { setFacturaEstado } from "@/lib/actions/facturas";

const GRID = "1.1fr 1.8fr .9fr .9fr 1.2fr 1fr";
const YEARS = [2026, 2025, 2024];
const SOCIO_TABS: [string, string][] = [["all", "Todas"], ["ana", "Ana"], ["jorge", "Jorge"]];
const ESTADO_TABS: [string, string][] = [["all", "Todos"], ["draft", "Sin enviar"], ["pending", "Pendientes"], ["paid", "Pagadas"]];

const ESTADO_META: Record<EstadoFactura, { label: string; fg: string; bg: string }> = {
  draft: { label: "Sin enviar", fg: "var(--text3)", bg: "var(--border2)" },
  pending: { label: "Pendiente de pago", fg: "#e0b25e", bg: "rgba(224,178,94,0.16)" },
  paid: { label: "Pagada", fg: "var(--ana)", bg: "rgba(92,191,152,0.16)" },
};

export default function FacturasList({ facturas }: { facturas: FacturaDTO[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [items, setItems] = useState<FacturaDTO[]>(facturas);
  const [year, setYear] = useState(2026);
  const [socio, setSocio] = useState<string>("all");
  const [estado, setEstado] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => setItems(facturas), [facturas]);

  const totalOf = (f: FacturaDTO) => facturaTotal(f.lineas, f.ivaRate, f.irpfRate);

  const invCount = items.length;
  const invPendTotal = useMemo(
    () => items.filter((f) => f.estado !== "paid").reduce((a, f) => a + totalOf(f), 0),
    [items],
  );

  const rows = useMemo(() => {
    const iq = search.trim().toLowerCase();
    return items
      .filter((f) => yearOf(f.fecha) === year)
      .filter((f) => socio === "all" || f.socio === socio)
      .filter((f) => estado === "all" || f.estado === estado)
      .filter((f) => {
        if (!iq) return true;
        const en = f.expedienteNombre || "";
        return (
          f.numero.toLowerCase().includes(iq) ||
          en.toLowerCase().includes(iq) ||
          (f.cliente.nombre || "").toLowerCase().includes(iq)
        );
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.numero.localeCompare(a.numero));
  }, [items, year, socio, estado, search]);

  const onEstado = (id: string, v: EstadoFactura) => {
    setItems((prev) => prev.map((f) => (f.id === id ? { ...f, estado: v } : f)));
    startTransition(() => { void setFacturaEstado(id, v); });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ flex: "none", padding: "28px 34px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.01em" }}>Facturación</div>
            <div style={{ fontSize: 12.5, color: "var(--mut)", marginTop: 4 }}>
              {invCount} facturas · {money(invPendTotal)} pendiente de cobro
            </div>
          </div>
          <div className="rowh" onClick={() => router.push("/facturacion/nueva")} style={{ background: "var(--accent)", color: "#fff", fontSize: 12.5, fontWeight: 600, padding: "10px 17px", cursor: "pointer" }}>+ Nueva factura</div>
        </div>

        {/* Año */}
        <div style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--border)" }}>
          {YEARS.map((y) => (
            <div key={y} onClick={() => setYear(y)} style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: year === y ? "#fff" : "var(--mut2)", padding: "0 0 12px", borderBottom: `2px solid ${year === y ? "var(--accent)" : "transparent"}`, marginBottom: -1 }}>{y}</div>
          ))}
        </div>

        {/* Socio */}
        <div style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--border)", marginTop: 14 }}>
          {SOCIO_TABS.map(([k, l]) => (
            <div key={k} onClick={() => setSocio(k)} style={{ cursor: "pointer", fontSize: 13, fontWeight: socio === k ? 600 : 400, color: socio === k ? "#fff" : "var(--mut2)", padding: "0 0 12px", borderBottom: `2px solid ${socio === k ? "var(--accent)" : "transparent"}`, marginBottom: -1 }}>{l}</div>
          ))}
        </div>

        {/* Búsqueda + estado */}
        <div style={{ display: "flex", alignItems: "center", gap: 26, padding: "18px 0 16px" }}>
          <div style={{ flex: "none", width: 300, border: "1px solid var(--border2)", background: "var(--deep)", padding: "9px 12px", display: "flex", alignItems: "center", gap: 9 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--mut3)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nº, expediente o cliente" style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: "var(--text)", width: "100%" }} />
          </div>
          <div style={{ display: "flex", gap: 22, fontSize: 12.5, letterSpacing: "0.03em" }}>
            {ESTADO_TABS.map(([k, l]) => (
              <span key={k} onClick={() => setEstado(k)} style={{ cursor: "pointer", color: estado === k ? "#fff" : "var(--mut2)", fontWeight: estado === k ? 600 : 400 }}>{l}</span>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: GRID, alignItems: "center", padding: "10px 12px", fontSize: 10, letterSpacing: "0.07em", color: "var(--mut2)", textTransform: "uppercase", borderBottom: "1px solid var(--border2)" }}>
          <div>Número</div><div>Expediente</div><div>Socio</div><div>Fecha</div><div>Estado</div><div style={{ textAlign: "right" }}>Total</div>
        </div>
      </div>

      <div className="tablescroll" style={{ flex: 1, overflow: "auto", padding: "0 34px 24px" }}>
        {rows.map((f) => {
          const meta = ESTADO_META[f.estado];
          const open = () => router.push(`/facturacion/${f.id}`);
          return (
            <div key={f.id} className="rowh" onClick={open} style={{ display: "grid", gridTemplateColumns: GRID, alignItems: "center", padding: "11px 12px", fontSize: 13, background: f.socio === "ana" ? "rgba(79,174,138,0.10)" : "rgba(91,143,214,0.10)", borderBottom: "1px solid var(--border2)", cursor: "pointer" }}>
              <div className="num" style={{ fontWeight: 600 }}>{f.numero}</div>
              <div style={{ color: f.expedienteNombre ? "var(--text2)" : "var(--mut4)" }}>{f.expedienteNombre || "—"}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 8, height: 8, flex: "none", background: socioColorVar(f.socio) }} />
                <span style={{ color: "var(--text2)" }}>{socioName(f.socio)}</span>
              </div>
              <div className="num" style={{ color: "var(--text3)" }}>{fmtDMY(f.fecha)}</div>
              <div onClick={(e) => e.stopPropagation()}>
                <select className="flatselect" value={f.estado} onChange={(e) => onEstado(f.id, e.target.value as EstadoFactura)} style={{ border: "none", padding: "5px 10px", fontSize: 11.5, fontWeight: 600, color: meta.fg, background: meta.bg }}>
                  <option value="draft" style={{ background: "var(--panel)", color: "var(--text)" }}>Sin enviar</option>
                  <option value="pending" style={{ background: "var(--panel)", color: "var(--text)" }}>Pendiente de pago</option>
                  <option value="paid" style={{ background: "var(--panel)", color: "var(--text)" }}>Pagada</option>
                </select>
              </div>
              <div className="num nowrap" style={{ textAlign: "right", fontWeight: 600 }}>{money(totalOf(f))}</div>
            </div>
          );
        })}
        {rows.length === 0 && <div style={{ padding: 40, textAlign: "center", fontSize: 13, color: "var(--mut3)" }}>No hay facturas con este filtro.</div>}
      </div>
    </div>
  );
}
