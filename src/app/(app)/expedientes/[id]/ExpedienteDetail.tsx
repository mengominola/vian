"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ExpedienteDTO, FacturaDTO, PagoDTO } from "@/lib/domain";
import {
  billedOf,
  isFinal,
  prioColor,
  PRIO_OPTION_BG,
  socioName,
  socioColorVar,
  facturaTotal,
} from "@/lib/domain";
import { money, moneyPlain, parseMoney, fmtDMY } from "@/lib/format";
import {
  patchExpediente,
  deleteExpediente,
  addPago,
  updatePago,
  removePago,
  toggleCobrado,
  associateFactura,
  unlinkFactura,
} from "@/lib/actions/expedientes";

export default function ExpedienteDetail({
  expediente,
  facturasSinAsociar,
  isNewInitial,
}: {
  expediente: ExpedienteDTO;
  facturasSinAsociar: FacturaDTO[];
  isNewInitial: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [draft, setDraft] = useState<ExpedienteDTO>(expediente);
  const [editMode, setEditMode] = useState(isNewInitial);
  const [isNew, setIsNew] = useState(isNewInitial);
  const [nameError, setNameError] = useState(false);
  const [budgetError, setBudgetError] = useState(false);
  const [pagosError, setPagosError] = useState(false);
  const [raw, setRaw] = useState<Record<string, string>>({});

  useEffect(() => setDraft(expediente), [expediente]);

  const persist = (fn: () => Promise<unknown> | void) => startTransition(() => { void fn(); });

  const fin = isFinal(draft.estado);
  const billed = billedOf(draft.pagos);
  const pend = (draft.presupuesto || 0) - billed;
  const hasBudget = draft.presupuesto !== null && draft.presupuesto !== undefined;

  // ── helpers de estado local ────────────────────────────────────────────────
  const patchDraft = (p: Partial<ExpedienteDTO>) => setDraft((d) => ({ ...d, ...p }));
  const patchCliente = (field: keyof ExpedienteDTO["cliente"], value: string) =>
    setDraft((d) => ({ ...d, cliente: { ...d.cliente, [field]: value } }));
  const patchPagoLocal = (pagoId: string, p: Partial<PagoDTO>) =>
    setDraft((d) => ({ ...d, pagos: d.pagos.map((pg) => (pg.id === pagoId ? { ...pg, ...p } : pg)) }));

  // ── acciones de campos del expediente ───────────────────────────────────────
  const onNameChange = (v: string) => {
    const up = v.toUpperCase();
    patchDraft({ name: up });
    if (nameError && up.trim()) setNameError(false);
  };
  const onNameBlur = () => persist(() => patchExpediente(draft.id, { name: draft.name }));

  const onPresuChange = (v: string) => {
    setRaw((r) => ({ ...r, presu: v }));
    patchDraft({ presupuesto: parseMoney(v) });
    if (budgetError && parseMoney(v) > 0) setBudgetError(false);
  };
  const onPresuBlur = () => {
    setRaw((r) => { const { presu, ...rest } = r; void presu; return rest; });
    persist(() => patchExpediente(draft.id, { presupuesto: draft.presupuesto }));
  };

  const onPrioridad = (v: string) => {
    const p = v ? parseInt(v, 10) : null;
    patchDraft({ prioridad: p });
    persist(() => patchExpediente(draft.id, { prioridad: p }));
  };
  const onToggleSeguro = () => {
    const next = !draft.seguro;
    patchDraft({ seguro: next });
    persist(() => patchExpediente(draft.id, { seguro: next }));
  };
  const onToggleFinal = () => {
    const next = fin ? "" : "Finalizado";
    patchDraft({ estado: next });
    persist(() => patchExpediente(draft.id, { estado: next }));
  };
  const onCliBlur = (field: keyof ExpedienteDTO["cliente"], value: string) => {
    const key = ("cliente" + field.charAt(0).toUpperCase() + field.slice(1)) as
      | "clienteNombre" | "clienteDireccion" | "clienteEmail" | "clienteTelefono" | "clienteDni" | "clienteNotas";
    persist(() => patchExpediente(draft.id, { [key]: value }));
  };

  // ── pagos ────────────────────────────────────────────────────────────────
  const onAddPago = () => {
    setPagosError(false);
    setEditMode(true);
    persist(async () => { await addPago(draft.id); });
  };
  const onToggleCobrado = (pagoId: string) => {
    // No fuerza el modo edición: el check de cobrado se usa por sí solo.
    persist(async () => { await toggleCobrado(pagoId); });
  };
  const onRemovePago = (pagoId: string) => {
    patchDraft({ pagos: draft.pagos.filter((p) => p.id !== pagoId) });
    persist(async () => { await removePago(pagoId); });
  };

  // ── modo edición / crear ────────────────────────────────────────────────────
  const toggleEdit = () => {
    if (editMode && isNew) {
      const nameBad = !draft.name.trim();
      const budgetBad = !(Number(draft.presupuesto) > 0);
      const pagosBad = draft.pagos.length === 0;
      if (nameBad || budgetBad || pagosBad) {
        setNameError(nameBad);
        setBudgetError(budgetBad);
        setPagosError(pagosBad);
        return;
      }
      setEditMode(false);
      setIsNew(false);
      setNameError(false);
      setBudgetError(false);
      setPagosError(false);
      router.replace(`/expedientes/${draft.id}`);
      return;
    }
    setEditMode((v) => !v);
    setNameError(false);
    setBudgetError(false);
    setPagosError(false);
  };

  const cancelNew = () => {
    const id = draft.id;
    persist(async () => { await deleteExpediente(id); });
    router.push("/expedientes");
  };
  const backToList = () => {
    if (isNew) cancelNew();
    else router.push("/expedientes");
  };

  const editLabel = editMode ? (isNew ? "Crear expediente" : "Listo") : "Editar";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        boxShadow: editMode ? "inset 0 0 0 3px var(--accent)" : "none",
      }}
    >
      {/* Cabecera */}
      <div style={{ flex: "none", padding: "24px 34px 0" }}>
        <div
          onClick={backToList}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", color: "var(--mut)", fontSize: 12.5, marginBottom: 16 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="11 6 5 12 11 18" /></svg>
          {isNew ? "Cancelar" : "Expedientes"}
        </div>

        <div style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <input
                  className={`valbox ${editMode ? "edit" : ""}`}
                  readOnly={!editMode}
                  value={draft.name}
                  onChange={(e) => onNameChange(e.target.value)}
                  onBlur={onNameBlur}
                  placeholder="NOMBRE DEL EXPEDIENTE"
                  style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em", padding: "4px 8px", width: 420, maxWidth: "100%", textTransform: "uppercase", marginLeft: -8, boxShadow: nameError ? "inset 0 0 0 1.5px var(--accent)" : undefined }}
                />
                {nameError && (
                  <span style={{ fontSize: 11.5, color: "var(--accent)", paddingLeft: 2 }}>Escribe un nombre para crear el expediente.</span>
                )}
              </div>

              <select
                className="flatselect"
                value={draft.prioridad ?? ""}
                onChange={(e) => onPrioridad(e.target.value)}
                style={{ width: 26, height: 24, flex: "none", textAlign: "center", textAlignLast: "center", border: "none", fontSize: 14, fontWeight: 700, color: draft.prioridad ? prioColor(draft.prioridad) : "var(--mut2)", background: "transparent" }}
              >
                <option value="" style={{ background: "var(--panel)", color: "var(--text3)" }}>—</option>
                {[1, 2, 3, 4, 5].map((p) => (
                  <option key={p} value={p} style={{ background: PRIO_OPTION_BG[p], color: "#141414" }}>{p}</option>
                ))}
              </select>

              <div
                onClick={onToggleSeguro}
                style={{ cursor: "pointer", flex: "none", display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", background: draft.seguro ? "rgba(92,191,152,0.15)" : "rgba(232,85,103,0.15)", color: draft.seguro ? "var(--ana)" : "var(--accent)", fontSize: 12, fontWeight: 600 }}
              >
                {draft.seguro ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12" /></svg>
                    Asegurado
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l9 16H3z" /><line x1="12" y1="9.5" x2="12" y2="14" /><circle cx="12" cy="16.6" r="0.3" fill="currentColor" stroke="none" /></svg>
                    Sin alta en seguro
                  </>
                )}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
              {isNew && (
                <div onClick={cancelNew} className="ghostbtn" style={{ cursor: "pointer", color: "var(--text3)", fontSize: 13, fontWeight: 600, padding: "10px 18px", background: "transparent" }}>Descartar</div>
              )}
              <div
                onClick={toggleEdit}
                className="ghostbtn"
                style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: editMode ? "#fff" : "var(--text)", background: editMode ? "var(--accent)" : "var(--border2)", fontSize: 13, fontWeight: 600, padding: "10px 20px" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                {editLabel}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12.5, color: "var(--mut)", marginTop: 6 }}>
            {isNew && !draft.estado ? "Nuevo expediente" : draft.estado || "(sin nota)"}
          </div>

          {/* Cliente — campos subrayados, siempre editables */}
          <div style={{ display: "flex", flexWrap: "wrap", columnGap: 28, rowGap: 12, marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--hover)" }}>
            <CliField label="Cliente" width={210} value={draft.cliente.nombre} placeholder="Nombre del cliente" onChange={(v) => patchCliente("nombre", v)} onBlur={(v) => onCliBlur("nombre", v)} />
            <CliField label="Dirección" width={230} value={draft.cliente.direccion} onChange={(v) => patchCliente("direccion", v)} onBlur={(v) => onCliBlur("direccion", v)} />
            <CliField label="Email" width={190} value={draft.cliente.email} onChange={(v) => patchCliente("email", v)} onBlur={(v) => onCliBlur("email", v)} />
            <CliField label="Teléfono" width={150} value={draft.cliente.telefono} onChange={(v) => patchCliente("telefono", v)} onBlur={(v) => onCliBlur("telefono", v)} />
            <CliField label="DNI / NIF" width={130} value={draft.cliente.dni} onChange={(v) => patchCliente("dni", v)} onBlur={(v) => onCliBlur("dni", v)} />
            <CliField label="Notas" full value={draft.cliente.notas ?? ""} onChange={(v) => patchCliente("notas", v)} onBlur={(v) => onCliBlur("notas", v)} />
          </div>

          {/* Resumen */}
          <div style={{ display: "flex", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", marginTop: 18 }}>
            <div style={{ flex: 1, padding: "15px 18px", borderRight: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.06em", color: "var(--mut)", textTransform: "uppercase" }}>Presupuesto</div>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  className={`num valbox ${editMode ? "edit" : ""}`}
                  readOnly={!editMode}
                  inputMode="decimal"
                  value={editMode ? (raw.presu ?? moneyPlain(draft.presupuesto)) : money(draft.presupuesto)}
                  onChange={(e) => onPresuChange(e.target.value)}
                  onBlur={onPresuBlur}
                  style={{ width: "100%", marginLeft: -6, fontSize: 20, fontWeight: 700, marginTop: 6, padding: "5px 32px 5px 6px", boxShadow: budgetError ? "inset 0 0 0 1.5px var(--accent)" : undefined }}
                />
                {editMode && <span style={{ position: "absolute", right: 10, top: 6, bottom: 0, display: "flex", alignItems: "center", color: "var(--mut2)", fontSize: 18, fontWeight: 700, pointerEvents: "none" }}>€</span>}
              </div>
              {budgetError && <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 5 }}>Indica un presupuesto.</div>}
            </div>
            <SummaryCell label="Facturado" value={money(billed)} />
            <SummaryCell label="Pendiente" value={hasBudget ? money(pend) : "—"} color={pend > 0.5 ? "var(--text)" : "var(--mut2)"} />
            <SummaryCell label="Pagos" value={String(draft.pagos.length)} last />
          </div>
        </div>
      </div>

      {/* Pagos (scroll) */}
      <div className="tablescroll" style={{ flex: 1, overflow: "auto", padding: "0 34px 30px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)" }}>Pagos</div>
            {pagosError && <span style={{ fontSize: 11, color: "var(--accent)" }}>Divide el presupuesto en al menos un pago.</span>}
          </div>
          <div onClick={onAddPago} className="rowh" style={{ background: "var(--accent)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "8px 15px", cursor: "pointer" }}>+ Añadir pago</div>
        </div>

        {draft.pagos.length === 0 ? (
          <div style={{ border: "1px solid var(--border)", padding: 40, textAlign: "center", color: "var(--mut3)", fontSize: 13 }}>Sin pagos registrados todavía.</div>
        ) : (
          <div className="tablescroll" style={{ display: "flex", flexWrap: "nowrap", gap: 16, alignItems: "stretch", overflowX: "auto", paddingBottom: 10 }}>
            {draft.pagos.map((pg, idx) => (
              <PagoCard
                key={pg.id}
                pg={pg}
                n={idx + 1}
                editMode={editMode}
                raw={raw}
                setRaw={setRaw}
                facturasSinAsociar={facturasSinAsociar}
                onImporteBlur={(v) => { patchPagoLocal(pg.id, { importe: v }); persist(() => updatePago(pg.id, { importe: v })); }}
                onImporteLocal={(v) => patchPagoLocal(pg.id, { importe: v })}
                onFecha={(v) => { patchPagoLocal(pg.id, { fecha: v }); persist(() => updatePago(pg.id, { fecha: v })); }}
                onFacturaPor={(v) => { patchPagoLocal(pg.id, { facturaPor: v }); persist(() => updatePago(pg.id, { facturaPor: v })); }}
                onRepartoLocal={(p) => patchPagoLocal(pg.id, p)}
                onRepartoBlur={(p) => persist(() => updatePago(pg.id, p))}
                onToggleCobrado={() => onToggleCobrado(pg.id)}
                onDelete={() => onRemovePago(pg.id)}
                onAssociate={(fid) => persist(() => associateFactura(draft.id, pg.id, fid))}
                onUnlink={() => { patchPagoLocal(pg.id, { facturaId: null, facturaNumero: null, facturaSocio: null }); persist(() => unlinkFactura(pg.id)); }}
                onGenerate={() => router.push(`/facturacion/nueva?expediente=${draft.id}&pago=${pg.id}`)}
              />
            ))}
          </div>
        )}

        {/* Finalizado */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-start" }}>
          <div onClick={onToggleFinal} className="rowh" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, background: "var(--border2)", color: "var(--text)", fontSize: 12.5, fontWeight: 600, padding: "10px 20px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12" /></svg>
            {fin ? "Reabrir expediente" : "Marcar como finalizado"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Subcomponentes ─────────────────────────────────────────────────────────

function CliField({ label, width, full, value, placeholder, onChange, onBlur }: {
  label: string; width?: number; full?: boolean; value: string; placeholder?: string;
  onChange: (v: string) => void; onBlur: (v: string) => void;
}) {
  return (
    <div style={full ? { flexBasis: "100%", width: "100%" } : { width }}>
      <div style={{ fontSize: 9.5, letterSpacing: "0.06em", color: "var(--mut2)", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <input className="fieldline" value={value} onChange={(e) => onChange(e.target.value)} onBlur={(e) => onBlur(e.target.value)} placeholder={placeholder ?? "—"} style={{ width: "100%", fontSize: 13 }} />
    </div>
  );
}

function SummaryCell({ label, value, color, last }: { label: string; value: string; color?: string; last?: boolean }) {
  return (
    <div style={{ flex: 1, padding: "15px 18px", borderRight: last ? "none" : "1px solid var(--border)" }}>
      <div style={{ fontSize: 10, letterSpacing: "0.06em", color: "var(--mut)", textTransform: "uppercase" }}>{label}</div>
      <div className="num" style={{ fontSize: 20, fontWeight: 700, marginTop: 7, color: color ?? "var(--text)" }}>{value}</div>
    </div>
  );
}

function PagoCard({
  pg, n, editMode, raw, setRaw, facturasSinAsociar,
  onImporteBlur, onImporteLocal, onFecha, onFacturaPor, onRepartoLocal, onRepartoBlur,
  onToggleCobrado, onDelete, onAssociate, onUnlink, onGenerate,
}: {
  pg: PagoDTO; n: number; editMode: boolean; raw: Record<string, string>;
  setRaw: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  facturasSinAsociar: FacturaDTO[];
  onImporteBlur: (v: number) => void; onImporteLocal: (v: number) => void;
  onFecha: (v: string) => void; onFacturaPor: (v: "socio1" | "socio2") => void;
  onRepartoLocal: (p: Partial<PagoDTO>) => void; onRepartoBlur: (p: Partial<PagoDTO>) => void;
  onToggleCobrado: () => void; onDelete: () => void;
  onAssociate: (facturaId: string) => void; onUnlink: () => void; onGenerate: () => void;
}) {
  const impKey = "imp:" + pg.id;
  const sum = (Number(pg.s1) || 0) + (Number(pg.s2) || 0) + (Number(pg.emp) || 0);
  const sumWarn = Math.abs(sum - 100) > 0.5;
  const titleTint = !pg.cobrado ? "transparent" : pg.facturaPor === "socio1" ? "rgba(79,174,138,0.13)" : "rgba(91,143,214,0.13)";

  const setImp = (v: string) => { setRaw((r) => ({ ...r, [impKey]: v })); onImporteLocal(parseMoney(v)); };
  const blurImp = () => { setRaw((r) => { const { [impKey]: _omit, ...rest } = r; void _omit; return rest; }); onImporteBlur(parseMoney(raw[impKey] ?? String(pg.importe))); };

  const options = facturasSinAsociar.map((f) => ({ id: f.id, label: `${f.numero} · ${socioName(f.socio)} · ${money(facturaTotal(f.lineas, f.ivaRate, f.irpfRate))}` }));

  return (
    <div style={{ width: 288, flex: "none", background: "var(--panel)", minHeight: 300 }}>
      {/* Barra de título */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", height: 46, borderBottom: "1px solid var(--border)", background: titleTint }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>Pago {n}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          {editMode ? (
            <>
              <input className="editfield num" type="date" value={pg.fecha ?? ""} onChange={(e) => onFecha(e.target.value)} style={{ fontSize: 11, padding: "3px 5px", width: 92, textAlign: "center" }} />
              <div onClick={onDelete} style={{ cursor: "pointer", color: "var(--mut2)", fontSize: 16, lineHeight: 1 }}>×</div>
            </>
          ) : (
            <span className="num" style={{ fontSize: 12, color: "var(--text3)" }}>{pg.fecha ? fmtDMY(pg.fecha) : ""}</span>
          )}
        </div>
      </div>

      <div style={{ padding: "18px 16px" }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <input
            className={`num valbox ${editMode ? "edit" : ""}`}
            readOnly={!editMode}
            inputMode="decimal"
            value={editMode ? (raw[impKey] ?? moneyPlain(pg.importe)) : money(pg.importe)}
            onChange={(e) => setImp(e.target.value)}
            onBlur={blurImp}
            style={{ width: "100%", marginLeft: -6, fontSize: 23, fontWeight: 700, padding: "4px 34px 4px 6px" }}
          />
          {editMode && <span style={{ position: "absolute", right: 10, top: 0, bottom: 0, display: "flex", alignItems: "center", color: "var(--mut2)", fontSize: 21, fontWeight: 700, pointerEvents: "none" }}>€</span>}
        </div>

        {/* Cobrado */}
        <div onClick={onToggleCobrado} style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 16, cursor: "pointer" }}>
          <span style={{ width: 16, height: 16, flex: "none", background: pg.cobrado ? "var(--ana)" : "transparent", boxShadow: `inset 0 0 0 1.5px ${pg.cobrado ? "var(--ana)" : "var(--mut10)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {pg.cobrado && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#141414" strokeWidth="3.5"><polyline points="20 6 9 17 4 12" /></svg>}
          </span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: pg.cobrado ? "var(--ana)" : "var(--mut)" }}>{pg.cobrado ? "Cobrado" : "Marcar como cobrado"}</span>
        </div>

        {!pg.cobrado && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)", fontSize: 11.5, color: "var(--mut3)", lineHeight: 1.5 }}>
            Sin facturar. Marca el pago como cobrado para asignar quién factura, el reparto y la factura asociada.
          </div>
        )}

        {pg.cobrado && (
          <>
            {/* Facturado por */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 14 }}>
              <span style={{ fontSize: 10, letterSpacing: "0.06em", color: "var(--mut2)", textTransform: "uppercase" }}>Facturado por</span>
              {editMode ? (
                <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                  <select value={pg.facturaPor ?? "socio1"} onChange={(e) => onFacturaPor(e.target.value as "socio1" | "socio2")} style={{ color: socioColorVar(pg.facturaPor), fontSize: 14, fontWeight: 600, padding: "2px 15px 2px 2px", cursor: "pointer" }}>
                    <option value="socio1" style={{ background: "var(--panel)", color: "var(--ana)" }}>Ana</option>
                    <option value="socio2" style={{ background: "var(--panel)", color: "var(--jorge)" }}>Jorge</option>
                  </select>
                  <span style={{ position: "absolute", right: 2, pointerEvents: "none", color: "var(--mut)", fontSize: 8 }}>▼</span>
                </span>
              ) : (
                <span style={{ fontSize: 14, fontWeight: 600, color: socioColorVar(pg.facturaPor) }}>{socioName(pg.facturaPor)}</span>
              )}
            </div>

            {/* Reparto */}
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 9.5, letterSpacing: "0.06em", color: "var(--mut2)", textTransform: "uppercase", marginBottom: 8 }}>Reparto</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <RepartoRow name="Ana" color="var(--ana)" pct={pg.s1} amount={money((pg.importe || 0) * (pg.s1 || 0) / 100)} editMode={editMode}
                  onLocal={(v) => onRepartoLocal({ s1: v })} onBlur={(v) => onRepartoBlur({ s1: v })} />
                <RepartoRow name="Jorge" color="var(--jorge)" pct={pg.s2} amount={money((pg.importe || 0) * (pg.s2 || 0) / 100)} editMode={editMode}
                  onLocal={(v) => onRepartoLocal({ s2: v })} onBlur={(v) => onRepartoBlur({ s2: v })} />
                <RepartoRow name="Empresa" color="var(--text3)" pct={pg.emp} amount={money((pg.importe || 0) * (pg.emp || 0) / 100)} editMode={editMode}
                  onLocal={(v) => onRepartoLocal({ emp: v })} onBlur={(v) => onRepartoBlur({ emp: v })} />
                {editMode && sumWarn && <span style={{ fontSize: 11, color: "var(--accent)" }}>suma {sum}%</span>}
              </div>
            </div>

            {/* Factura */}
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 9.5, letterSpacing: "0.06em", color: "var(--mut2)", textTransform: "uppercase", marginBottom: 8 }}>Factura</div>
              {pg.facturaId ? (
                <>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 600 }}>{pg.facturaNumero}</span>
                    <span style={{ fontSize: 12.5, color: "var(--text3)" }}>{socioName(pg.facturaSocio ?? "ana")}</span>
                  </div>
                  {editMode && <div onClick={onUnlink} style={{ cursor: "pointer", fontSize: 11, color: "var(--mut2)", marginTop: 7 }}>quitar</div>}
                </>
              ) : (
                <>
                  <select className="flatselect" value="" onChange={(e) => { if (e.target.value) onAssociate(e.target.value); }} style={{ border: "none", background: "var(--field)", color: "var(--text)", fontSize: 12, padding: "7px 10px", width: "100%" }}>
                    <option value="" style={{ background: "var(--panel)", color: "var(--mut)" }}>Asociar factura existente…</option>
                    {options.map((o) => (
                      <option key={o.id} value={o.id} style={{ background: "var(--panel)", color: "var(--text)" }}>{o.label}</option>
                    ))}
                  </select>
                  {options.length === 0 && <div style={{ fontSize: 11, color: "var(--mut3)", marginTop: 6 }}>No hay facturas sin asociar.</div>}
                  <div onClick={onGenerate} style={{ cursor: "pointer", color: "var(--accent)", fontSize: 11.5, fontWeight: 600, marginTop: 8 }}>+ Generar nueva</div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RepartoRow({ name, color, pct, amount, editMode, onLocal, onBlur }: {
  name: string; color: string; pct: number; amount: string; editMode: boolean;
  onLocal: (v: number) => void; onBlur: (v: number) => void;
}) {
  if (editMode) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 26 }}>
        <span style={{ fontSize: 12, color }}>{name}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input type="number" className="flatnum editfield" value={pct} onChange={(e) => onLocal(parseFloat(e.target.value) || 0)} onBlur={(e) => onBlur(parseFloat(e.target.value) || 0)} style={{ width: 56, fontSize: 12, textAlign: "right", padding: "4px 6px" }} />
          <span style={{ fontSize: 11, color: "var(--mut2)" }}>%</span>
        </span>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 26 }}>
      <span style={{ color, fontSize: 13.5, fontWeight: 600 }}>{name}</span>
      <span className="num nowrap" style={{ fontSize: 13 }}>{amount} <span style={{ color: "var(--mut2)" }}>· {pct}%</span></span>
    </div>
  );
}
