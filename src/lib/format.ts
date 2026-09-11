// Formato es-ES fiel al prototipo. Importes: "1.828,20 €" (2 decimales, "." miles,
// "," decimales). Fechas visibles: dd/mm/aaaa. Se almacenan en ISO YYYY-MM-DD.
// Se usa un espacio duro ( ) antes del € para que nunca salte de línea.

const EURO = " €";

export const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

/** "1.828,20 €"; null/undefined => "—" (guion largo, como el prototipo). */
export function money(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return (
    Number(n).toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    }) + EURO
  );
}

/** "1.828,20" sin símbolo (para campos editables). */
export function moneyPlain(n: number | null | undefined): string {
  return (Number(n) || 0).toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  });
}

/** Interpreta un importe escrito en formato es-ES ("1.828,20") o simple ("1828.20"). */
export function parseMoney(raw: string | number): number {
  let s = String(raw).replace(/\s/g, "");
  if (s.indexOf(",") >= 0) s = s.replace(/\./g, "").replace(",", ".");
  return parseFloat(s) || 0;
}

// ── Fechas (ISO YYYY-MM-DD como fuente en la UI) ────────────────────────────

/** Date (UTC) -> "YYYY-MM-DD". */
export function toISODate(d: Date | string | null | undefined): string {
  if (!d) return "";
  if (typeof d === "string") return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" -> "dd/mm/aaaa". */
export function fmtDMY(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = iso.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** "YYYY-MM-DD" -> "20 de enero de 2026" (para la hoja de factura). */
export function fmtLong(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso.slice(0, 10) + "T00:00:00.000Z");
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Año a partir de una fecha ISO. */
export function yearOf(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const y = parseInt(iso.slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

/** Mes (0-11) a partir de una fecha ISO. */
export function monthOf(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const m = iso.slice(5, 7);
  const n = parseInt(m, 10);
  return Number.isFinite(n) ? n - 1 : null;
}

export const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/** Hoy en ISO YYYY-MM-DD (UTC). */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
