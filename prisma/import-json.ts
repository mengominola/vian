/**
 * Importa expedientes + pagos desde un JSON (generado del Excel).
 *
 * Uso (dev):   npm run import:data -- "<ruta-al-json>"
 * Uso (prod):  npm run import:data:prod -- "<ruta-al-json>"
 *
 * BORRA los expedientes/pagos/facturas/gastos existentes y los sustituye por el
 * contenido del JSON. Conserva usuarios, SocioConfig y AppSettings (los crea si faltan).
 */
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";

const argv = process.argv.slice(2);
const useProd = argv.includes("--prod");
const jsonPath = argv.find((a) => !a.startsWith("--"));

if (useProd) {
  const p = path.join(process.cwd(), ".env.prod");
  if (!fs.existsSync(p)) { console.error("✖ Falta .env.prod"); process.exit(1); }
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*(DATABASE_URL|DIRECT_URL)\s*=\s*(.*?)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1").replace(/\r$/, "");
  }
}
if (!jsonPath || !fs.existsSync(jsonPath)) {
  console.error('✖ Indica la ruta del JSON: npm run import:data -- "<ruta>"');
  process.exit(1);
}

interface PagoIn { importe: number; cobrado: boolean; s1: number; s2: number; emp: number; }
interface ExpIn { name: string; estado: string; prioridad: number | null; presupuesto: number | null; creado: string; seguro: boolean; pagos: PagoIn[]; }

const toDate = (iso: string) => new Date(iso.slice(0, 10) + "T00:00:00.000Z");

const SOCIO_DATA = {
  ana:   { nombre: "Ana García Moratín", nif: "00000000A", direccion: "Calle de Moratín 12, 3ºB", cp: "28014 Madrid", email: "ana@vianestudio.com" },
  jorge: { nombre: "Jorge Ruiz Moratín",  nif: "11111111B", direccion: "Calle de Moratín 12, 3ºB", cp: "28014 Madrid", email: "jorge@vianestudio.com" },
};

async function main() {
  const data: ExpIn[] = JSON.parse(fs.readFileSync(jsonPath!, "utf8"));
  const prisma = new PrismaClient();
  const host = (process.env.DIRECT_URL || process.env.DATABASE_URL || "").split("@")[1]?.split("/")[0] || "?";
  console.log(`Destino: ${useProd ? "PROD" : "DEV"}  host=${host}  expedientes=${data.length}`);

  // Config base (no sobrescribe si ya existe)
  for (const k of ["ana", "jorge"] as const) {
    const sd = SOCIO_DATA[k];
    await prisma.socioConfig.upsert({
      where: { socio: k },
      update: {},
      create: { socio: k, ...sd, facturaSerie: "2026/", facturaAncho: 3, proximoNumero: 1 },
    });
  }
  await prisma.appSettings.upsert({
    where: { id: "app" },
    update: {},
    create: { id: "app", iban: "ES00 0000 0000 0000 0000 0000" },
  });

  // Limpieza de datos de proyecto
  await prisma.facturaLinea.deleteMany();
  await prisma.factura.deleteMany();
  await prisma.pago.deleteMany();
  await prisma.expediente.deleteMany();
  await prisma.gasto.deleteMany();

  // Inserción masiva
  const expRows = data.map((e) => ({
    id: randomUUID(),
    name: e.name,
    estado: e.estado ?? "",
    prioridad: e.prioridad,
    presupuesto: e.presupuesto,
    creado: toDate(e.creado),
    seguro: !!e.seguro,
  }));
  await prisma.expediente.createMany({ data: expRows });

  const pagoRows: {
    id: string; expedienteId: string; orden: number; importe: number; cobrado: boolean;
    fecha: null; facturaPor: null; s1: number; s2: number; emp: number;
  }[] = [];
  data.forEach((e, i) => {
    e.pagos.forEach((pg, idx) => {
      pagoRows.push({
        id: randomUUID(), expedienteId: expRows[i].id, orden: idx,
        importe: pg.importe, cobrado: !!pg.cobrado, fecha: null, facturaPor: null,
        s1: pg.s1 ?? 45, s2: pg.s2 ?? 45, emp: pg.emp ?? 10,
      });
    });
  });
  if (pagoRows.length) await prisma.pago.createMany({ data: pagoRows });

  console.log(`✔ Importados ${expRows.length} expedientes y ${pagoRows.length} pagos.`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
