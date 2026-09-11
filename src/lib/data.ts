import { prisma } from "./db";
import { toISODate } from "./format";
import type {
  ExpedienteDTO,
  PagoDTO,
  FacturaDTO,
  GastoDTO,
  SocioConfigDTO,
  AppSettingsDTO,
  FacturaPor,
  SocioKey,
  EstadoFactura,
  EntidadGasto,
} from "./domain";

// ── Mappers Prisma → DTO (fechas a ISO YYYY-MM-DD) ───────────────────────────

type PagoRow = {
  id: string;
  orden: number;
  importe: number;
  cobrado: boolean;
  fecha: Date | null;
  facturaPor: string | null;
  s1: number;
  s2: number;
  emp: number;
  factura: { id: string; numero: string; socio: string } | null;
};

function mapPago(pg: PagoRow): PagoDTO {
  return {
    id: pg.id,
    orden: pg.orden,
    importe: pg.importe,
    cobrado: pg.cobrado,
    fecha: pg.fecha ? toISODate(pg.fecha) : null,
    facturaPor: (pg.facturaPor as FacturaPor) ?? null,
    s1: pg.s1,
    s2: pg.s2,
    emp: pg.emp,
    facturaId: pg.factura?.id ?? null,
    facturaNumero: pg.factura?.numero ?? null,
    facturaSocio: (pg.factura?.socio as SocioKey) ?? null,
  };
}

const expedienteInclude = {
  pagos: { orderBy: { orden: "asc" as const }, include: { factura: true } },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapExpediente(e: any): ExpedienteDTO {
  return {
    id: e.id,
    name: e.name,
    estado: e.estado ?? "",
    prioridad: e.prioridad ?? null,
    presupuesto: e.presupuesto ?? null,
    creado: toISODate(e.creado),
    seguro: e.seguro,
    cliente: {
      nombre: e.clienteNombre ?? "",
      direccion: e.clienteDireccion ?? "",
      email: e.clienteEmail ?? "",
      telefono: e.clienteTelefono ?? "",
      dni: e.clienteDni ?? "",
      notas: e.clienteNotas ?? "",
    },
    pagos: (e.pagos ?? []).map(mapPago),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFactura(f: any): FacturaDTO {
  return {
    id: f.id,
    numero: f.numero,
    socio: f.socio as SocioKey,
    fecha: toISODate(f.fecha),
    estado: f.estado as EstadoFactura,
    expedienteId: f.expedienteId ?? null,
    expedienteNombre: f.expediente?.name ?? null,
    pagoId: f.pagoId ?? null,
    cliente: {
      nombre: f.clienteNombre ?? "",
      direccion: f.clienteDireccion ?? "",
      email: f.clienteEmail ?? "",
      telefono: f.clienteTelefono ?? "",
      dni: f.clienteDni ?? "",
    },
    lineas: (f.lineas ?? [])
      .slice()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => a.orden - b.orden)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((l: any) => ({ concepto: l.concepto ?? "", base: l.base })),
    ivaRate: f.ivaRate,
    irpfRate: f.irpfRate,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGasto(g: any): GastoDTO {
  return {
    id: g.id,
    concepto: g.concepto ?? "",
    importe: g.importe,
    fecha: toISODate(g.fecha),
    entidad: g.entidad as EntidadGasto,
    compensado: g.compensado,
    noComputable: g.noComputable,
  };
}

// ── Consultas ────────────────────────────────────────────────────────────────

export async function getExpedientes(): Promise<ExpedienteDTO[]> {
  const rows = await prisma.expediente.findMany({
    orderBy: { name: "asc" },
    include: expedienteInclude,
  });
  return rows.map(mapExpediente);
}

export async function getExpediente(id: string): Promise<ExpedienteDTO | null> {
  const e = await prisma.expediente.findUnique({
    where: { id },
    include: expedienteInclude,
  });
  return e ? mapExpediente(e) : null;
}

export async function getFacturas(): Promise<FacturaDTO[]> {
  const rows = await prisma.factura.findMany({
    orderBy: [{ fecha: "desc" }, { numero: "desc" }],
    include: { lineas: true, expediente: true },
  });
  return rows.map(mapFactura);
}

export async function getFactura(id: string): Promise<FacturaDTO | null> {
  const f = await prisma.factura.findUnique({
    where: { id },
    include: { lineas: true, expediente: true },
  });
  return f ? mapFactura(f) : null;
}

/** Facturas sin asociar a ningún expediente (para el desplegable de asociar). */
export async function getFacturasSinAsociar(): Promise<FacturaDTO[]> {
  const rows = await prisma.factura.findMany({
    where: { expedienteId: null },
    orderBy: [{ fecha: "desc" }, { numero: "desc" }],
    include: { lineas: true, expediente: true },
  });
  return rows.map(mapFactura);
}

export async function getGastos(): Promise<GastoDTO[]> {
  const rows = await prisma.gasto.findMany({ orderBy: { fecha: "asc" } });
  return rows.map(mapGasto);
}

export async function getSocioConfigs(): Promise<SocioConfigDTO[]> {
  const rows = await prisma.socioConfig.findMany();
  return rows.map((c) => ({
    socio: c.socio as SocioKey,
    nombre: c.nombre,
    nif: c.nif,
    direccion: c.direccion,
    cp: c.cp,
    email: c.email,
    facturaSerie: c.facturaSerie,
    facturaAncho: c.facturaAncho,
    proximoNumero: c.proximoNumero,
  }));
}

export async function getAppSettings(): Promise<AppSettingsDTO> {
  const s = await prisma.appSettings.findUnique({ where: { id: "app" } });
  return {
    formaPagoTexto: s?.formaPagoTexto ?? "Transferencia bancaria al número de cuenta de ARQUIA",
    iban: s?.iban ?? "",
  };
}
