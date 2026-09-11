/**
 * Seed VIAN — reproduce fielmente los datos de muestra y la migración
 * `componentDidMount` del prototipo (VIAN.dc.html):
 *  - Cada pago con `factura` genera una Factura renumerada "2026/NNN" por socio,
 *    en orden de iteración.
 *  - estado = 'paid' si el expediente contiene "finalizado" (/finalizado/i), si no 'pending'.
 *  - base de la línea = redondeo a céntimos de importe/1,21 (importe lleva IVA 21%).
 *  - Todos los pagos de la muestra quedan cobrado: true.
 *  - `seguro` = true para los ids que el prototipo tenía cableados.
 *  - `creado` = 2026-01-01 para todos (el filtro por año muestra 2026).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const round2 = (n: number) => Math.round(n * 100) / 100;
const d = (iso: string) => new Date(iso + "T00:00:00.000Z"); // UTC medianoche
const CREADO = d("2026-01-01");

type RawFactura = { numero: string; socio: "socio1" | "socio2" } | null;
type RawPago = {
  id: string;
  fecha: string;
  importe: number;
  facturaPor: "socio1" | "socio2";
  s1: number;
  s2: number;
  emp: number;
  factura: RawFactura;
};
type RawCliente = {
  nombre: string;
  direccion: string;
  email: string;
  telefono: string;
  dni: string;
  notas: string;
};
type RawExpediente = {
  id: string;
  name: string;
  estado: string;
  prioridad: number | null;
  presupuesto: number | null;
  cliente: RawCliente;
  pagos: RawPago[];
};

const EMPTY_CLI: RawCliente = { nombre: "", direccion: "", email: "", telefono: "", dni: "", notas: "" };
const rep = { s1: 45, s2: 45, emp: 10 };

const EXPEDIENTES: RawExpediente[] = [
  { id: "e1", name: "ALTEA", estado: "Finalizado", prioridad: null, presupuesto: 500, cliente: EMPTY_CLI,
    pagos: [{ id: "e1p1", fecha: "2026-01-20", importe: 500, facturaPor: "socio1", ...rep, factura: { numero: "S1-26003", socio: "socio1" } }] },
  { id: "e2", name: "ALCALA 107", estado: "Seguimiento + licencia ECU mirador", prioridad: 3, presupuesto: 2332, cliente: EMPTY_CLI,
    pagos: [
      { id: "e2p1", fecha: "2026-01-18", importe: 1166, facturaPor: "socio1", ...rep, factura: { numero: "S1-26005", socio: "socio1" } },
      { id: "e2p2", fecha: "2026-05-04", importe: 932.8, facturaPor: "socio2", ...rep, factura: null },
    ] },
  { id: "e3", name: "ALCALA 572", estado: "A esperas de último pago", prioridad: 1, presupuesto: 8833,
    cliente: { nombre: "GC Real Estate S.L.", direccion: "Calle Alcalá 572, 28027 Madrid", email: "administracion@gcrealestate.es", telefono: "+34 91 555 22 10", dni: "B22579767", notas: "Prefiere factura a nombre de la SL, no de la promoción." },
    pagos: [
      { id: "e3p1", fecha: "2026-01-25", importe: 2349.9, facturaPor: "socio1", ...rep, factura: { numero: "S1-26008", socio: "socio1" } },
      { id: "e3p2", fecha: "2026-03-02", importe: 5321.5, facturaPor: "socio2", ...rep, factura: { numero: "S2-26006", socio: "socio2" } },
      { id: "e3p3", fecha: "2026-06-10", importe: 960.0, facturaPor: "socio1", ...rep, factura: null },
    ] },
  { id: "e4", name: "AMORINO CANALEJAS", estado: "Finalizado", prioridad: null, presupuesto: null, cliente: EMPTY_CLI, pagos: [] },
  { id: "e5", name: "ANCORA", estado: "Finalizado", prioridad: null, presupuesto: 689.8, cliente: EMPTY_CLI,
    pagos: [{ id: "e5p1", fecha: "2026-01-30", importe: 689.8, facturaPor: "socio2", ...rep, factura: { numero: "S2-26002", socio: "socio2" } }] },
  { id: "e6", name: "ALGODRE", estado: "Tasas + presentar DR + PAGOS — a esperas // informe", prioridad: null, presupuesto: 2014, cliente: EMPTY_CLI, pagos: [] },
  { id: "e7", name: "ANICETO MARINAS 2", estado: "Finalizado", prioridad: null, presupuesto: 1400, cliente: EMPTY_CLI,
    pagos: [
      { id: "e7p1", fecha: "2026-02-06", importe: 700, facturaPor: "socio1", ...rep, factura: { numero: "S1-26006", socio: "socio1" } },
      { id: "e7p2", fecha: "2026-02-20", importe: 700, facturaPor: "socio2", ...rep, factura: { numero: "S2-26003", socio: "socio2" } },
    ] },
  { id: "e8", name: "ANTONIO CAVERO", estado: "Pendiente de licencia", prioridad: 5, presupuesto: 10285, cliente: EMPTY_CLI,
    pagos: [
      { id: "e8p1", fecha: "2026-02-12", importe: 3085.5, facturaPor: "socio1", ...rep, factura: { numero: "S1-26007", socio: "socio1" } },
      { id: "e8p2", fecha: "2026-04-01", importe: 5142.5, facturaPor: "socio2", ...rep, factura: null },
    ] },
  { id: "e9", name: "ARENAL", estado: "Finalizado", prioridad: null, presupuesto: null, cliente: EMPTY_CLI, pagos: [] },
  { id: "e10", name: "BEA", estado: "Finalizado", prioridad: null, presupuesto: 700, cliente: EMPTY_CLI,
    pagos: [{ id: "e10p1", fecha: "2026-02-15", importe: 700, facturaPor: "socio1", ...rep, factura: { numero: "S1-26004", socio: "socio1" } }] },
  { id: "e11", name: "BILBAO", estado: "Finalizado", prioridad: null, presupuesto: null, cliente: EMPTY_CLI, pagos: [] },
  { id: "e12", name: "BOCANGEL", estado: "Finalizado", prioridad: null, presupuesto: 2500, cliente: EMPTY_CLI,
    pagos: [
      { id: "e12p1", fecha: "2026-02-19", importe: 1250, facturaPor: "socio1", ...rep, factura: { numero: "S1-26009", socio: "socio1" } },
      { id: "e12p2", fecha: "2026-03-10", importe: 1000, facturaPor: "socio2", ...rep, factura: { numero: "S2-26007", socio: "socio2" } },
    ] },
  { id: "e13", name: "BARRENCALLE", estado: "Desarrollo de licencia", prioridad: null, presupuesto: 3448.5, cliente: EMPTY_CLI,
    pagos: [{ id: "e13p1", fecha: "2026-02-21", importe: 1724.25, facturaPor: "socio1", ...rep, factura: null }] },
  { id: "e14", name: "BEA - ALMAGRO 26", estado: "A falta de CUE, aceptación presupuesto CUE?", prioridad: 1, presupuesto: 2332, cliente: EMPTY_CLI,
    pagos: [{ id: "e14p1", fecha: "2026-02-25", importe: 1166, facturaPor: "socio2", ...rep, factura: null }] },
  { id: "e15", name: "BEA - COLEGIATA", estado: "Pendiente de ayuntamiento", prioridad: 1, presupuesto: 1815, cliente: EMPTY_CLI,
    pagos: [{ id: "e15p1", fecha: "2026-02-27", importe: 907.5, facturaPor: "socio1", ...rep, factura: { numero: "S1-26010", socio: "socio1" } }] },
  { id: "e16", name: "BEA - FELIPE IV", estado: "A esperas de certificado", prioridad: 1, presupuesto: 2014, cliente: EMPTY_CLI,
    pagos: [
      { id: "e16p1", fecha: "2026-03-02", importe: 1007, facturaPor: "socio1", ...rep, factura: { numero: "S1-26011", socio: "socio1" } },
      { id: "e16p2", fecha: "2026-04-15", importe: 805.6, facturaPor: "socio2", ...rep, factura: null },
    ] },
  { id: "e17", name: "BEA - GUTIERREZ SOLANA", estado: "Medición realizada", prioridad: null, presupuesto: 3206.5, cliente: EMPTY_CLI,
    pagos: [{ id: "e17p1", fecha: "2026-03-05", importe: 181.5, facturaPor: "socio1", ...rep, factura: null }] },
  { id: "e18", name: "BEA - HOYOS DE ESPINO 7", estado: "1º pago realizado", prioridad: null, presupuesto: 3146.5, cliente: EMPTY_CLI,
    pagos: [{ id: "e18p1", fecha: "2026-03-09", importe: 1573, facturaPor: "socio2", ...rep, factura: { numero: "S2-26008", socio: "socio2" } }] },
  { id: "e19", name: "BEA - KERRIA", estado: "Finalizado", prioridad: 5, presupuesto: 2014, cliente: EMPTY_CLI,
    pagos: [{ id: "e19p1", fecha: "2026-03-11", importe: 1007, facturaPor: "socio1", ...rep, factura: { numero: "S1-26012", socio: "socio1" } }] },
  { id: "e20", name: "BEA - MARCELIANO SANTA MARÍA", estado: "A esperas de ayuntamiento", prioridad: 5, presupuesto: 2238.5, cliente: EMPTY_CLI,
    pagos: [
      { id: "e20p1", fecha: "2026-03-15", importe: 1119.25, facturaPor: "socio2", ...rep, factura: { numero: "S2-26010", socio: "socio2" } },
      { id: "e20p2", fecha: "2026-05-02", importe: 895.4, facturaPor: "socio1", ...rep, factura: null },
    ] },
  { id: "e21", name: "BEA - LAGASCA 126", estado: "Finalizado", prioridad: 5, presupuesto: 1590, cliente: EMPTY_CLI,
    pagos: [{ id: "e21p1", fecha: "2026-03-19", importe: 795, facturaPor: "socio1", ...rep, factura: { numero: "S1-26013", socio: "socio1" } }] },
];

const SEGURO_IDS = new Set(["e1", "e3", "e5", "e7", "e10", "e12", "e19", "e21"]);

const GASTOS = [
  { concepto: "Cuota Colegio Arquitectos", importe: 82.5, fecha: "2026-01-12", entidad: "empresa" },
  { concepto: "Licencia software CAD", importe: 245.0, fecha: "2026-02-03", entidad: "empresa" },
  { concepto: "Material impresión planos", importe: 63.2, fecha: "2026-02-18", entidad: "socio1" },
  { concepto: "Gasolina visita obra", importe: 48.9, fecha: "2026-03-07", entidad: "socio2" },
  { concepto: "Gestoría trimestre", importe: 150.0, fecha: "2026-03-28", entidad: "empresa" },
];

const SOCIO_DATA = {
  ana: { nombre: "Ana García Moratín", nif: "00000000A", direccion: "Calle de Moratín 12, 3ºB", cp: "28014 Madrid", email: "ana@vian.es", iban: "ES00 0000 0000 0000 0000 0000" },
  jorge: { nombre: "Jorge Ruiz Moratín", nif: "11111111B", direccion: "Calle de Moratín 12, 3ºB", cp: "28014 Madrid", email: "jorge@vian.es", iban: "ES11 1111 1111 1111 1111 1111" },
};

const socioKey = (s: "socio1" | "socio2") => (s === "socio1" ? "ana" : "jorge");
const isFinalizado = (estado: string) => /finalizado/i.test(estado || "");

async function main() {
  // Limpieza (orden respetando FKs)
  await prisma.facturaLinea.deleteMany();
  await prisma.factura.deleteMany();
  await prisma.pago.deleteMany();
  await prisma.expediente.deleteMany();
  await prisma.gasto.deleteMany();
  await prisma.socioConfig.deleteMany();
  await prisma.appSettings.deleteMany();

  const seq: Record<"ana" | "jorge", number> = { ana: 0, jorge: 0 };

  for (const e of EXPEDIENTES) {
    const exp = await prisma.expediente.create({
      data: {
        name: e.name,
        estado: e.estado,
        prioridad: e.prioridad,
        presupuesto: e.presupuesto,
        creado: CREADO,
        seguro: SEGURO_IDS.has(e.id),
        clienteNombre: e.cliente.nombre,
        clienteDireccion: e.cliente.direccion,
        clienteEmail: e.cliente.email,
        clienteTelefono: e.cliente.telefono,
        clienteDni: e.cliente.dni,
        clienteNotas: e.cliente.notas,
      },
    });

    for (let i = 0; i < e.pagos.length; i++) {
      const pg = e.pagos[i];
      const pago = await prisma.pago.create({
        data: {
          expedienteId: exp.id,
          orden: i,
          importe: pg.importe,
          cobrado: true, // toda la muestra queda cobrada
          fecha: d(pg.fecha),
          facturaPor: pg.facturaPor,
          s1: pg.s1,
          s2: pg.s2,
          emp: pg.emp,
        },
      });

      if (pg.factura) {
        const k = socioKey(pg.factura.socio);
        seq[k]++;
        const numero = "2026/" + String(seq[k]).padStart(3, "0");
        const base = round2(pg.importe / 1.21);
        await prisma.factura.create({
          data: {
            numero,
            socio: k,
            fecha: d(pg.fecha),
            estado: isFinalizado(e.estado) ? "paid" : "pending",
            expedienteId: exp.id,
            pagoId: pago.id,
            clienteNombre: e.cliente.nombre,
            clienteDireccion: e.cliente.direccion,
            clienteEmail: e.cliente.email,
            clienteTelefono: e.cliente.telefono,
            clienteDni: e.cliente.dni,
            ivaRate: 21,
            irpfRate: 0,
            lineas: { create: [{ concepto: e.name, base, orden: 0 }] },
          },
        });
      }
    }
  }

  for (const g of GASTOS) {
    await prisma.gasto.create({
      data: { concepto: g.concepto, importe: g.importe, fecha: d(g.fecha), entidad: g.entidad, compensado: false, noComputable: false },
    });
  }

  for (const k of ["ana", "jorge"] as const) {
    const sd = SOCIO_DATA[k];
    await prisma.socioConfig.create({
      data: {
        socio: k,
        nombre: sd.nombre,
        nif: sd.nif,
        direccion: sd.direccion,
        cp: sd.cp,
        email: sd.email,
        facturaSerie: "2026/",
        facturaAncho: 3,
        proximoNumero: seq[k] + 1, // siguiente correlativo tras la migración
      },
    });
  }

  await prisma.appSettings.create({ data: { id: "app", iban: "ES00 0000 0000 0000 0000 0000" } });

  console.log(`Seed OK — ${EXPEDIENTES.length} expedientes, facturas Ana=${seq.ana} Jorge=${seq.jorge}, ${GASTOS.length} gastos.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
