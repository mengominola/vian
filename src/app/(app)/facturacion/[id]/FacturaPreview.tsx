"use client";

import { useRouter } from "next/navigation";
import type { FacturaDTO } from "@/lib/domain";
import { facturaBase, facturaTotal, socioName } from "@/lib/domain";
import { money, fmtLong } from "@/lib/format";

interface Emisor {
  nombre: string;
  nif: string;
  direccion: string;
  cp: string;
}

const clean = (s: string) =>
  (s || "").replace(/[\\/\s]+/g, "_").replace(/[^\w\-áéíóúÁÉÍÓÚñÑ.]/g, "");

export default function FacturaPreview({
  factura,
  emisor,
  formaPago,
  iban,
}: {
  factura: FacturaDTO;
  emisor: Emisor;
  formaPago: string;
  iban: string;
}) {
  const router = useRouter();

  const base = facturaBase(factura.lineas);
  const ivaR = Number(factura.ivaRate) || 0;
  const irpfR = Number(factura.irpfRate) || 0;
  const total = facturaTotal(factura.lineas, ivaR, irpfR);
  const cli = factura.cliente;
  const exp = factura.expedienteNombre
    ? clean(factura.expedienteNombre)
    : clean(cli.nombre) || "Cliente";
  const socioNm = socioName(factura.socio);
  const fileBase = `${clean(factura.numero)}_${socioNm}_${exp}`;

  const onPrint = () => {
    const prev = document.title;
    document.title = fileBase;
    window.print();
    setTimeout(() => {
      document.title = prev;
    }, 500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Barra superior (no se imprime) */}
      <div style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 34px", borderBottom: "1px solid var(--border)" }}>
        <div onClick={() => router.push("/facturacion")} style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", color: "var(--mut)", fontSize: 12.5 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="11 6 5 12 11 18" /></svg>
          Facturación
        </div>
        <div className="num" style={{ fontSize: 12, color: "var(--mut2)" }}>{fileBase}.pdf</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div onClick={() => router.push(`/facturacion/${factura.id}/editar`)} className="ghostbtn" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 7, color: "var(--text)", background: "var(--border2)", fontSize: 12.5, fontWeight: 600, padding: "9px 16px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
            Editar
          </div>
          <div onClick={onPrint} className="rowh" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 7, background: "var(--accent)", color: "#fff", fontSize: 12.5, fontWeight: 600, padding: "9px 16px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V3h12v6" /><path d="M6 18H4v-6h16v6h-2" /><rect x="8" y="15" width="8" height="6" /></svg>
            Imprimir PDF
          </div>
        </div>
      </div>

      {/* Hoja A4 */}
      <div className="tablescroll" style={{ flex: 1, overflow: "auto", padding: "36px 34px", display: "flex", justifyContent: "center" }}>
        <div id="factura-sheet" style={{ width: 794, flex: "none", background: "#fff", color: "#141414", minHeight: 1123, display: "flex", fontSize: 12, lineHeight: 1.5 }}>
          <div style={{ width: 6, flex: "none", background: "#e85567" }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "60px 56px" }}>
            {/* Cabecera */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 2 }}>{emisor.nombre}</div>
                <div className="num" style={{ color: "var(--mut6)" }}>NIF {emisor.nif}</div>
                <div className="num" style={{ color: "var(--mut6)" }}>{emisor.direccion}</div>
                {emisor.cp && <div className="num" style={{ color: "var(--mut6)" }}>{emisor.cp}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "#e85567", fontWeight: 700 }}>FACTURA</div>
                <div className="num" style={{ fontSize: 23, fontWeight: 700, marginTop: 4 }}>{factura.numero}</div>
                <div className="num" style={{ fontSize: 12, color: "var(--mut7)", marginTop: 3 }}>{fmtLong(factura.fecha)}</div>
              </div>
            </div>
            <div style={{ height: 1, background: "var(--text)", margin: "22px 0 44px" }} />

            {/* Cliente */}
            <div style={{ marginBottom: 56 }}>
              <div style={{ fontSize: 8.5, letterSpacing: "0.11em", color: "var(--mut9)", textTransform: "uppercase", marginBottom: 6 }}>Cliente</div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{cli.nombre || "—"}</div>
              {cli.dni && <div className="num" style={{ color: "var(--mut6)" }}>NIF {cli.dni}</div>}
              {cli.direccion && <div className="num" style={{ color: "var(--mut6)" }}>{cli.direccion}</div>}
              {cli.email && <div style={{ color: "var(--mut6)" }}>{cli.email}</div>}
            </div>

            {factura.expedienteNombre && (
              <div style={{ fontSize: 11.5, color: "var(--mut7)", marginBottom: 16 }}>
                Expediente · <span style={{ color: "#141414", fontWeight: 600 }}>{factura.expedienteNombre}</span>
              </div>
            )}

            {/* Líneas */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", padding: "8px 0", borderBottom: "2px solid #141414", fontSize: 8.5, letterSpacing: "0.09em", color: "var(--mut8)", textTransform: "uppercase" }}>
              <div>Concepto</div><div style={{ textAlign: "right" }}>Importe</div>
            </div>
            {factura.lineas.map((l, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px", padding: "12px 0", borderBottom: "1px solid var(--text)" }}>
                <div>{l.concepto || "—"}</div>
                <div className="num nowrap" style={{ textAlign: "right" }}>{money(l.base)}</div>
              </div>
            ))}

            {/* Totales */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
              <div style={{ width: 260 }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", color: "var(--mut6)" }}><span>Base imponible</span><span className="num nowrap">{money(base)}</span></div>
                {ivaR > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", color: "var(--mut6)" }}><span>IVA ({ivaR}%)</span><span className="num nowrap">{money(base * ivaR / 100)}</span></div>
                )}
                {irpfR > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", color: "var(--mut6)" }}><span>Retención IRPF ({irpfR}%)</span><span className="num nowrap">− {money(base * irpfR / 100)}</span></div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "10px 0 0", marginTop: 4, borderTop: "2px solid #141414" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Total</span>
                  <span className="num nowrap" style={{ fontSize: 20, fontWeight: 700, color: "#e85567" }}>{money(total)}</span>
                </div>
              </div>
            </div>

            {/* Forma de pago + logo, pegados abajo */}
            <div style={{ marginTop: "auto", paddingTop: 18, borderTop: "1px solid var(--text)", color: "var(--mut6)" }}>
              <span style={{ color: "var(--mut9)", fontSize: 8.5, letterSpacing: "0.11em", textTransform: "uppercase" }}>Forma de pago</span><br />
              {formaPago}<br />
              <span className="num">{iban}</span>
              <div style={{ marginTop: 24, fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "#e85567", lineHeight: 1 }}>vian</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
