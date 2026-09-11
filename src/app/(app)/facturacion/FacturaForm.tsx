"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ExpedienteDTO, SocioKey, EstadoFactura } from "@/lib/domain";
import { socioColorVar } from "@/lib/domain";
import { money, moneyPlain, parseMoney } from "@/lib/format";
import { saveFactura, type SaveFacturaInput } from "@/lib/actions/facturas";

export interface FormState {
  id: string | null;
  socio: SocioKey;
  numero: string;
  fecha: string; // ISO
  estado: EstadoFactura;
  expedienteId: string; // "" = sin asociar
  pagoId: string; // "" = sin pago
  cliente: { nombre: string; direccion: string; email: string; telefono: string; dni: string };
  lineas: { concepto: string; base: string }[];
  ivaOn: boolean;
  ivaRate: string;
  irpfOn: boolean;
  irpfRate: string;
}

export default function FacturaForm({
  initial,
  expedientes,
  nextNumeroBySocio,
  returnTo,
  subtitle,
}: {
  initial: FormState;
  expedientes: ExpedienteDTO[];
  nextNumeroBySocio: Record<SocioKey, string>;
  returnTo: string;
  subtitle: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [f, setF] = useState<FormState>(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const patch = (p: Partial<FormState>) => setF((s) => ({ ...s, ...p }));

  const ivaR = f.ivaOn ? parseMoney(f.ivaRate) || 0 : 0;
  const irpfR = f.irpfOn ? parseMoney(f.irpfRate) || 0 : 0;
  const base = f.lineas.reduce((a, l) => a + (parseMoney(l.base) || 0), 0);
  const total = base + (base * ivaR) / 100 - (base * irpfR) / 100;

  const selExp = f.expedienteId ? expedientes.find((e) => e.id === f.expedienteId) : null;
  const pagoOptions = selExp
    ? selExp.pagos
        .filter((pg) => !pg.facturaId || pg.id === f.pagoId)
        .map((pg) => ({ value: pg.id, label: `Pago ${pg.orden + 1} · ${money(pg.importe)}` }))
    : [];

  const onSocio = (socio: SocioKey) => patch({ socio, numero: !f.id ? nextNumeroBySocio[socio] : f.numero });

  const onExpediente = (id: string) => {
    const e = id ? expedientes.find((x) => x.id === id) : null;
    const p: Partial<FormState> = { expedienteId: id, pagoId: "" };
    if (e) p.cliente = { nombre: e.cliente.nombre, direccion: e.cliente.direccion, email: e.cliente.email, telefono: e.cliente.telefono, dni: e.cliente.dni };
    patch(p);
  };

  const onPago = (pid: string) => {
    const pg = selExp?.pagos.find((p) => p.id === pid);
    const p: Partial<FormState> = { pagoId: pid };
    if (pg) {
      const b = f.ivaOn ? pg.importe / (1 + (parseMoney(f.ivaRate) || 0) / 100) : pg.importe;
      p.lineas = [{ concepto: "", base: moneyPlain(Math.round(b * 100) / 100) }];
      if (pg.fecha) p.fecha = pg.fecha;
    }
    patch(p);
  };

  const setLinea = (i: number, p: Partial<{ concepto: string; base: string }>) =>
    patch({ lineas: f.lineas.map((l, ix) => (ix === i ? { ...l, ...p } : l)) });
  const addLinea = () => patch({ lineas: [...f.lineas, { concepto: "", base: "" }] });
  const removeLinea = (i: number) => patch({ lineas: f.lineas.length > 1 ? f.lineas.filter((_, ix) => ix !== i) : f.lineas });

  const onSave = () => {
    const numero = f.numero.trim();
    const lineas = f.lineas.map((l) => ({ concepto: l.concepto.trim(), base: parseMoney(l.base) || 0 })).filter((l) => l.concepto || l.base);
    const totalBase = lineas.reduce((a, l) => a + l.base, 0);
    if (!numero) { setError("Indica un número de factura."); return; }
    if (lineas.length === 0 || totalBase <= 0) { setError("Añade al menos una línea con importe."); return; }
    if (f.lineas.some((l) => (parseMoney(l.base) || 0) > 0 && !l.concepto.trim())) { setError("Añade el concepto de cada línea."); return; }
    setError("");
    setSaving(true);
    const input: SaveFacturaInput = {
      id: f.id,
      numero,
      socio: f.socio,
      fecha: f.fecha,
      estado: f.estado,
      expedienteId: f.expedienteId || null,
      pagoId: f.pagoId || null,
      cliente: f.cliente,
      lineas,
      ivaRate: ivaR,
      irpfRate: irpfR,
    };
    startTransition(async () => {
      const res = await saveFactura(input);
      if (!res.ok) { setError(res.error || "No se pudo guardar."); setSaving(false); return; }
      router.push(returnTo);
    });
  };

  const microLabel: React.CSSProperties = { fontSize: 9.5, letterSpacing: "0.06em", color: "var(--mut2)", textTransform: "uppercase", marginBottom: 5 };
  const fieldSelect: React.CSSProperties = { border: "none", background: "var(--field)", padding: "8px 10px", fontSize: 13, color: "var(--text)", width: "100%" };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, boxShadow: "inset 0 0 0 3px var(--accent)" }}>
      <div style={{ flex: "none", padding: "24px 34px 0" }}>
        <div onClick={() => router.push(returnTo)} style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", color: "var(--mut)", fontSize: 12.5, marginBottom: 16 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="11 6 5 12 11 18" /></svg>
          Cancelar
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--mut)" }}>Factura</span>
              <input className="valbox edit" value={f.numero} onChange={(e) => patch({ numero: e.target.value })} placeholder="2026/001" style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em", padding: "4px 8px", width: 180 }} />
            </div>
            <div style={{ fontSize: 12.5, color: "var(--mut)", marginTop: 6 }}>{subtitle}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div onClick={() => router.push(returnTo)} className="ghostbtn" style={{ cursor: "pointer", color: "var(--text3)", fontSize: 13, fontWeight: 600, padding: "10px 18px", background: "transparent" }}>Cancelar</div>
            <div onClick={saving ? undefined : onSave} className="rowh" style={{ cursor: saving ? "default" : "pointer", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 600, padding: "10px 22px", opacity: saving ? 0.7 : 1 }}>Guardar factura</div>
          </div>
        </div>
      </div>

      <div className="tablescroll" style={{ flex: 1, overflow: "auto", padding: "22px 34px 30px" }}>
        {/* Cabecera de factura */}
        <div style={{ display: "flex", flexWrap: "wrap", columnGap: 28, rowGap: 14, paddingBottom: 18, borderBottom: "1px solid var(--border)" }}>
          <div style={{ width: 150 }}>
            <div style={microLabel}>Socio que factura</div>
            <select className="flatselect" value={f.socio} onChange={(e) => onSocio(e.target.value as SocioKey)} style={{ ...fieldSelect, fontSize: 13.5, fontWeight: 600, color: socioColorVar(f.socio) }}>
              <option value="ana" style={{ background: "var(--panel)", color: "var(--text)" }}>Ana</option>
              <option value="jorge" style={{ background: "var(--panel)", color: "var(--text)" }}>Jorge</option>
            </select>
          </div>
          <div style={{ width: 150 }}>
            <div style={microLabel}>Fecha</div>
            <input className="editfield num" type="date" value={f.fecha} onChange={(e) => e.target.value && patch({ fecha: e.target.value })} style={{ fontSize: 14, width: "100%", padding: "6px 9px" }} />
          </div>
          <div style={{ width: 170 }}>
            <div style={microLabel}>Estado</div>
            <select className="flatselect" value={f.estado} onChange={(e) => patch({ estado: e.target.value as EstadoFactura })} style={fieldSelect}>
              <option value="draft" style={{ background: "var(--panel)" }}>Sin enviar</option>
              <option value="pending" style={{ background: "var(--panel)" }}>Pendiente de pago</option>
              <option value="paid" style={{ background: "var(--panel)" }}>Pagada</option>
            </select>
          </div>
          <div style={{ width: 230 }}>
            <div style={microLabel}>Expediente asociado</div>
            <select className="flatselect" value={f.expedienteId} onChange={(e) => onExpediente(e.target.value)} style={fieldSelect}>
              <option value="" style={{ background: "var(--panel)", color: "var(--text)" }}>— Sin asociar</option>
              {expedientes.map((e) => (
                <option key={e.id} value={e.id} style={{ background: "var(--panel)", color: "var(--text)" }}>{e.name || "(sin nombre)"}</option>
              ))}
            </select>
          </div>
          {f.expedienteId && (
            <div style={{ width: 230 }}>
              <div style={microLabel}>Pago asociado</div>
              <select className="flatselect" value={f.pagoId} onChange={(e) => onPago(e.target.value)} style={fieldSelect}>
                <option value="" style={{ background: "var(--panel)", color: "var(--mut)" }}>— Sin pago</option>
                {pagoOptions.map((o) => (
                  <option key={o.value} value={o.value} style={{ background: "var(--panel)", color: "var(--text)" }}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Cliente */}
        <div style={{ padding: "18px 0", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>Cliente</div>
          <div style={{ display: "flex", flexWrap: "wrap", columnGap: 28, rowGap: 14 }}>
            <FormCli label="Nombre" width={230} value={f.cliente.nombre} onChange={(v) => patch({ cliente: { ...f.cliente, nombre: v } })} />
            <FormCli label="Dirección" width={250} value={f.cliente.direccion} onChange={(v) => patch({ cliente: { ...f.cliente, direccion: v } })} />
            <FormCli label="Email" width={200} value={f.cliente.email} onChange={(v) => patch({ cliente: { ...f.cliente, email: v } })} />
            <FormCli label="Teléfono" width={150} value={f.cliente.telefono} onChange={(v) => patch({ cliente: { ...f.cliente, telefono: v } })} />
            <FormCli label="DNI / NIF" width={140} value={f.cliente.dni} onChange={(v) => patch({ cliente: { ...f.cliente, dni: v } })} />
          </div>
        </div>

        {/* Líneas */}
        <div style={{ padding: "18px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Conceptos</div>
            <div onClick={addLinea} style={{ cursor: "pointer", color: "var(--accent)", fontSize: 12, fontWeight: 600 }}>+ Añadir línea</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 150px 30px", gap: 12, padding: "0 2px 8px", fontSize: 9.5, letterSpacing: "0.06em", color: "var(--mut2)", textTransform: "uppercase" }}>
            <div>Concepto</div><div style={{ textAlign: "right" }}>Base (sin IVA)</div><div />
          </div>
          {f.lineas.map((l, i) => {
            const tint = f.socio === "ana" ? "rgba(79,174,138,0.10)" : "rgba(91,143,214,0.10)";
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 150px 30px", gap: 12, alignItems: "center", marginBottom: 8, background: tint, padding: "4px 2px" }}>
                <input className="editfield" value={l.concepto} onChange={(e) => setLinea(i, { concepto: e.target.value })} placeholder="Descripción del concepto" style={{ fontSize: 13, width: "100%", padding: "7px 9px" }} />
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input className="editfield num" value={l.base} onChange={(e) => setLinea(i, { base: e.target.value })} inputMode="decimal" placeholder="0,00" style={{ fontSize: 13, width: "100%", padding: "7px 24px 7px 9px", textAlign: "right" }} />
                  <span style={{ position: "absolute", right: 8, color: "var(--mut2)", fontSize: 12, pointerEvents: "none" }}>€</span>
                </div>
                {f.lineas.length > 1 ? (
                  <div onClick={() => removeLinea(i)} style={{ cursor: "pointer", color: "var(--mut2)", fontSize: 16, textAlign: "center" }}>×</div>
                ) : <div />}
              </div>
            );
          })}
        </div>

        {/* Impuestos + totales */}
        <div style={{ display: "flex", gap: 40, flexWrap: "wrap", paddingTop: 18, borderTop: "1px solid var(--border)" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>Impuestos</div>
            <TaxRow label="IVA" on={f.ivaOn} rate={f.ivaRate} onToggle={() => patch({ ivaOn: !f.ivaOn })} onRate={(v) => patch({ ivaRate: v })} />
            <div style={{ height: 14 }} />
            <TaxRow label="Retención IRPF" on={f.irpfOn} rate={f.irpfRate} onToggle={() => patch({ irpfOn: !f.irpfOn })} onRate={(v) => patch({ irpfRate: v })} />
          </div>
          <div style={{ width: 280, flex: "none" }}>
            <TotRow label="Base imponible" value={money(base)} />
            <TotRow label={`IVA (${ivaR}%)`} value={money((base * ivaR) / 100)} />
            <TotRow label={`IRPF (${irpfR}%)`} value={`− ${money((base * irpfR) / 100)}`} dim />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "12px 0 0" }}>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", color: "var(--text2)", textTransform: "uppercase" }}>Total</span>
              <span className="num nowrap" style={{ fontSize: 21, fontWeight: 700 }}>{money(total)}</span>
            </div>
          </div>
        </div>

        {error && <div style={{ marginTop: 16, color: "var(--accent)", fontSize: 12.5 }}>{error}</div>}
      </div>
    </div>
  );
}

function FormCli({ label, width, value, onChange }: { label: string; width: number; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ width }}>
      <div style={{ fontSize: 9.5, letterSpacing: "0.06em", color: "var(--mut2)", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <input className="fieldline" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", fontSize: 13 }} />
    </div>
  );
}

function TaxRow({ label, on, rate, onToggle, onRate }: { label: string; on: boolean; rate: string; onToggle: () => void; onRate: (v: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div onClick={onToggle} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", background: on ? "rgba(232,85,103,0.15)" : "var(--bar)", color: on ? "var(--accent)" : "var(--mut)", fontSize: 12.5, fontWeight: 600 }}>
        <span style={{ width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid currentColor", fontSize: 10 }}>{on ? "✓" : ""}</span> {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <input className="editfield num" value={rate} onChange={(e) => onRate(e.target.value)} style={{ width: 52, fontSize: 12.5, textAlign: "right", padding: "5px 7px" }} />
        <span style={{ fontSize: 12, color: "var(--mut2)" }}>%</span>
      </div>
    </div>
  );
}

function TotRow({ label, value, dim }: { label: string; value: string; dim?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--hover)" }}>
      <span style={{ fontSize: 12.5, color: "var(--text3)" }}>{label}</span>
      <span className="num nowrap" style={{ fontSize: 13.5, color: dim ? "var(--text3)" : undefined }}>{value}</span>
    </div>
  );
}
