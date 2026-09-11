// Lógica de dominio y tipos serializables (DTO) compartidos servidor/cliente.
// Portado fielmente del prototipo VIAN.dc.html.

export type SocioKey = "ana" | "jorge";
export type FacturaPor = "socio1" | "socio2" | null;
export type EstadoFactura = "draft" | "pending" | "paid";
export type EntidadGasto = "empresa" | "socio1" | "socio2";

// ── Socios ──────────────────────────────────────────────────────────────────
export const socioKey = (s: FacturaPor | SocioKey): SocioKey =>
  s === "socio1" || s === "ana" ? "ana" : "jorge";

export const facturaPorOf = (k: SocioKey): "socio1" | "socio2" =>
  k === "ana" ? "socio1" : "socio2";

export const socioName = (s: FacturaPor | SocioKey): string =>
  socioKey((s ?? "socio1") as SocioKey) === "ana" ? "Ana" : "Jorge";

/** Variable CSS del color del socio. */
export const socioColorVar = (s: FacturaPor | SocioKey): string =>
  socioKey((s ?? "socio1") as SocioKey) === "ana" ? "var(--ana)" : "var(--jorge)";

// ── Estado de expediente ─────────────────────────────────────────────────────
/** Coincidencia exacta (fiel a isFinal del prototipo, no subcadena). */
export const isFinal = (estado: string | null | undefined): boolean =>
  (estado || "").trim().toLowerCase() === "finalizado";

// ── Prioridad (rampa rojo→verde) ─────────────────────────────────────────────
/** Color del número de prioridad: hsl(6 + (p-1)/4*120, 62%, 45%). */
export function prioColor(p: number | null | undefined): string {
  if (!p) return "var(--mut2)";
  const t = (p - 1) / 4;
  const hue = 6 + t * 120;
  return `hsl(${hue}, 62%, 45%)`;
}

/** Fondo de cada opción del desplegable de prioridad (texto oscuro #141414). */
export const PRIO_OPTION_BG: Record<number, string> = {
  1: "hsl(6,60%,50%)",
  2: "hsl(36,60%,48%)",
  3: "hsl(66,58%,46%)",
  4: "hsl(96,52%,46%)",
  5: "hsl(126,50%,44%)",
};

// ── Estado de factura ────────────────────────────────────────────────────────
export interface EstadoMeta {
  label: string;
  fg: string;
  bg: string;
}
export function estadoMeta(k: EstadoFactura | string): EstadoMeta {
  const map: Record<EstadoFactura, EstadoMeta> = {
    draft: { label: "Sin enviar", fg: "var(--text3)", bg: "var(--border2)" },
    pending: { label: "Pendiente de pago", fg: "#e0b25e", bg: "rgba(224,178,94,0.16)" },
    paid: { label: "Pagada", fg: "var(--ana)", bg: "rgba(92,191,152,0.16)" },
  };
  return map[k as EstadoFactura] || { label: String(k), fg: "var(--text3)", bg: "var(--border2)" };
}

export const ESTADO_FACTURA_ORDER: EstadoFactura[] = ["draft", "pending", "paid"];

// ── Reparto por defecto ──────────────────────────────────────────────────────
export const REPARTO_DEFAULT = { s1: 45, s2: 45, emp: 10 };

// ── Cálculos derivados sobre líneas de factura ───────────────────────────────
export const facturaBase = (lineas: { base: number }[]): number =>
  (lineas || []).reduce((a, l) => a + (Number(l.base) || 0), 0);

export function facturaTotal(lineas: { base: number }[], ivaRate: number, irpfRate: number): number {
  const b = facturaBase(lineas);
  return b + (b * (Number(ivaRate) || 0)) / 100 - (b * (Number(irpfRate) || 0)) / 100;
}

// ── DTOs serializables (fechas como ISO YYYY-MM-DD) ──────────────────────────
export interface ClienteDTO {
  nombre: string;
  direccion: string;
  email: string;
  telefono: string;
  dni: string;
  notas?: string;
}

export interface PagoDTO {
  id: string;
  orden: number;
  importe: number;
  cobrado: boolean;
  fecha: string | null; // YYYY-MM-DD
  facturaPor: FacturaPor;
  s1: number;
  s2: number;
  emp: number;
  facturaId: string | null;
  facturaNumero: string | null;
  facturaSocio: SocioKey | null;
}

export interface ExpedienteDTO {
  id: string;
  name: string;
  estado: string;
  prioridad: number | null;
  presupuesto: number | null;
  creado: string; // YYYY-MM-DD
  seguro: boolean;
  cliente: ClienteDTO;
  pagos: PagoDTO[];
}

export interface FacturaLineaDTO {
  concepto: string;
  base: number;
}

export interface FacturaDTO {
  id: string;
  numero: string;
  socio: SocioKey;
  fecha: string; // YYYY-MM-DD
  estado: EstadoFactura;
  expedienteId: string | null;
  expedienteNombre: string | null;
  pagoId: string | null;
  cliente: ClienteDTO;
  lineas: FacturaLineaDTO[];
  ivaRate: number;
  irpfRate: number;
}

export interface GastoDTO {
  id: string;
  concepto: string;
  importe: number;
  fecha: string; // YYYY-MM-DD
  entidad: EntidadGasto;
  compensado: boolean;
  noComputable: boolean;
}

export interface SocioConfigDTO {
  socio: SocioKey;
  nombre: string;
  nif: string;
  direccion: string;
  cp: string;
  email: string;
  facturaSerie: string;
  facturaAncho: number;
  proximoNumero: number;
}

export interface AppSettingsDTO {
  formaPagoTexto: string;
  iban: string;
}

/** Suma de importes de pagos cobrados (billedOf del prototipo). */
export const billedOf = (pagos: { cobrado: boolean; importe: number }[]): number =>
  (pagos || []).reduce((s, pg) => s + (pg.cobrado ? Number(pg.importe) || 0 : 0), 0);

/** Siguiente número sugerido para un socio: serie + correlativo con relleno. */
export const nextNumero = (cfg: { facturaSerie: string; facturaAncho: number; proximoNumero: number }): string =>
  cfg.facturaSerie + String(cfg.proximoNumero).padStart(cfg.facturaAncho, "0");
