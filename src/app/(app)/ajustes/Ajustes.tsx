"use client";

import { useState, useTransition } from "react";
import type { SocioConfigDTO, SocioKey } from "@/lib/domain";
import { nextNumero, socioColorVar } from "@/lib/domain";
import { saveSocioConfig, saveAppSettings, type SocioConfigPatch } from "@/lib/actions/ajustes";

export default function Ajustes({ ana, jorge, formaPago, iban }: { ana: SocioConfigDTO; jorge: SocioConfigDTO; formaPago: string; iban: string }) {
  const [, startTransition] = useTransition();
  const [fp, setFp] = useState(formaPago);
  const [ib, setIb] = useState(iban);

  const saveFp = (v: string) => startTransition(() => { void saveAppSettings({ formaPagoTexto: v }); });
  const saveIb = (v: string) => startTransition(() => { void saveAppSettings({ iban: v }); });

  return (
    <div className="tablescroll" style={{ height: "100%", overflow: "auto", padding: "28px 34px 40px" }}>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.01em" }}>Ajustes</div>
      <div style={{ fontSize: 12.5, color: "var(--mut)", marginTop: 4 }}>Datos de emisor, forma de pago y numeración de facturas por socio.</div>

      <SocioBlock initial={ana} startTransition={startTransition} />
      <SocioBlock initial={jorge} startTransition={startTransition} />

      {/* Forma de pago + cuenta común (global) */}
      <div style={{ marginTop: 34, paddingTop: 22, borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Forma de pago</div>
        <div style={{ fontSize: 12, color: "var(--mut)", marginBottom: 16 }}>Aparece en el pie de todas las facturas, sea cual sea el socio emisor. Todas cobran en la misma cuenta común.</div>
        <div style={{ display: "flex", flexWrap: "wrap", columnGap: 20, rowGap: 16 }}>
          <div style={{ flex: 1, minWidth: 320, maxWidth: 560 }}>
            <div style={microLabel}>Texto de forma de pago</div>
            <textarea
              className="editfield"
              value={fp}
              onChange={(e) => setFp(e.target.value)}
              onBlur={(e) => saveFp(e.target.value)}
              rows={2}
              style={{ width: "100%", fontSize: 13, resize: "vertical", lineHeight: 1.5 }}
            />
          </div>
          <div style={{ width: 300 }}>
            <div style={microLabel}>IBAN (cuenta común)</div>
            <input
              className="editfield num"
              value={ib}
              onChange={(e) => setIb(e.target.value)}
              onBlur={(e) => saveIb(e.target.value)}
              placeholder="ES00 0000 0000 0000 0000 0000"
              style={{ width: "100%", fontSize: 13, padding: "8px 10px" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const microLabel: React.CSSProperties = { fontSize: 9.5, letterSpacing: "0.06em", color: "var(--mut2)", textTransform: "uppercase", marginBottom: 5 };

function SocioBlock({ initial, startTransition }: { initial: SocioConfigDTO; startTransition: React.TransitionStartFunction }) {
  const [c, setC] = useState<SocioConfigDTO>(initial);
  const socio: SocioKey = initial.socio;

  const patch = (p: Partial<SocioConfigDTO>) => setC((s) => ({ ...s, ...p }));
  const save = (p: SocioConfigPatch) => startTransition(() => { void saveSocioConfig(socio, p); });

  const preview = nextNumero({ facturaSerie: c.facturaSerie, facturaAncho: c.facturaAncho, proximoNumero: c.proximoNumero });

  return (
    <div style={{ marginTop: 30, paddingTop: 22, borderTop: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
        <span style={{ width: 10, height: 10, background: socioColorVar(socio) }} />
        <div style={{ fontSize: 15, fontWeight: 700, color: socioColorVar(socio) }}>{socio === "ana" ? "Ana" : "Jorge"}</div>
      </div>

      {/* Datos de emisor */}
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>Datos de emisor</div>
      <div style={{ display: "flex", flexWrap: "wrap", columnGap: 20, rowGap: 16, marginBottom: 8 }}>
        <Field label="Nombre fiscal" width={260} value={c.nombre} onChange={(v) => patch({ nombre: v })} onBlur={(v) => save({ nombre: v })} />
        <Field label="NIF" width={150} value={c.nif} onChange={(v) => patch({ nif: v })} onBlur={(v) => save({ nif: v })} />
        <Field label="Dirección" width={280} value={c.direccion} onChange={(v) => patch({ direccion: v })} onBlur={(v) => save({ direccion: v })} />
        <Field label="CP / Población" width={180} value={c.cp} onChange={(v) => patch({ cp: v })} onBlur={(v) => save({ cp: v })} />
        <Field label="Email" width={220} value={c.email} onChange={(v) => patch({ email: v })} onBlur={(v) => save({ email: v })} />
      </div>

      {/* Numeración */}
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "20px 0 14px" }}>Numeración de facturas</div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", columnGap: 20, rowGap: 16 }}>
        <Field label="Serie / prefijo" width={140} value={c.facturaSerie} onChange={(v) => patch({ facturaSerie: v })} onBlur={(v) => save({ facturaSerie: v })} />
        <NumField label="Dígitos" width={90} value={c.facturaAncho} onChange={(v) => patch({ facturaAncho: v })} onBlur={(v) => save({ facturaAncho: v })} />
        <NumField label="Próximo número" width={140} value={c.proximoNumero} onChange={(v) => patch({ proximoNumero: v })} onBlur={(v) => save({ proximoNumero: v })} />
        <div style={{ paddingBottom: 8 }}>
          <span style={{ fontSize: 12, color: "var(--mut)" }}>Siguiente factura: </span>
          <span className="num" style={{ fontSize: 13, fontWeight: 700, color: socioColorVar(socio) }}>{preview}</span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, width, value, onChange, onBlur, mono }: { label: string; width: number; value: string; onChange: (v: string) => void; onBlur: (v: string) => void; mono?: boolean }) {
  return (
    <div style={{ width }}>
      <div style={microLabel}>{label}</div>
      <input className={`editfield${mono ? " num" : ""}`} value={value} onChange={(e) => onChange(e.target.value)} onBlur={(e) => onBlur(e.target.value)} style={{ width: "100%", fontSize: 13, padding: "8px 10px" }} />
    </div>
  );
}

function NumField({ label, width, value, onChange, onBlur }: { label: string; width: number; value: number; onChange: (v: number) => void; onBlur: (v: number) => void }) {
  return (
    <div style={{ width }}>
      <div style={microLabel}>{label}</div>
      <input type="number" className="editfield num flatnum" value={value} onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)} onBlur={(e) => onBlur(parseInt(e.target.value, 10) || 0)} style={{ width: "100%", fontSize: 13, padding: "8px 10px", textAlign: "right" }} />
    </div>
  );
}
