"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { EstadoFactura, SocioKey } from "@/lib/domain";
import { requireUser } from "@/lib/auth-guard";

function isoToDate(iso: string): Date {
  const s = (iso || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date();
  return new Date(s + "T00:00:00.000Z");
}

export async function setFacturaEstado(id: string, estado: EstadoFactura) {
  await requireUser();
  await prisma.factura.update({ where: { id }, data: { estado } });
  revalidatePath("/facturacion");
}

export interface SaveFacturaInput {
  id?: string | null;
  numero: string;
  socio: SocioKey;
  fecha: string; // ISO
  estado: EstadoFactura;
  expedienteId: string | null;
  pagoId: string | null;
  cliente: { nombre: string; direccion: string; email: string; telefono: string; dni: string };
  lineas: { concepto: string; base: number }[];
  ivaRate: number;
  irpfRate: number;
}

export interface SaveFacturaResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function saveFactura(input: SaveFacturaInput): Promise<SaveFacturaResult> {
  await requireUser();
  const numero = (input.numero || "").trim();
  const lineas = input.lineas
    .map((l) => ({ concepto: (l.concepto || "").trim(), base: Number(l.base) || 0 }))
    .filter((l) => l.concepto || l.base);
  const totalBase = lineas.reduce((a, l) => a + l.base, 0);

  if (!numero) return { ok: false, error: "Indica un número de factura." };
  if (lineas.length === 0 || totalBase <= 0) return { ok: false, error: "Añade al menos una línea con importe." };
  if (input.lineas.some((l) => (Number(l.base) || 0) > 0 && !(l.concepto || "").trim()))
    return { ok: false, error: "Añade el concepto de cada línea." };

  const fecha = isoToDate(input.fecha);
  const data = {
    numero,
    socio: input.socio,
    fecha,
    estado: input.estado,
    expedienteId: input.expedienteId,
    pagoId: input.pagoId,
    clienteNombre: input.cliente.nombre,
    clienteDireccion: input.cliente.direccion,
    clienteEmail: input.cliente.email,
    clienteTelefono: input.cliente.telefono,
    clienteDni: input.cliente.dni,
    ivaRate: input.ivaRate,
    irpfRate: input.irpfRate,
  };

  let id: string;
  if (input.id) {
    const f = await prisma.factura.update({
      where: { id: input.id },
      data: {
        ...data,
        lineas: {
          deleteMany: {},
          create: lineas.map((l, i) => ({ concepto: l.concepto, base: l.base, orden: i })),
        },
      },
    });
    id = f.id;
  } else {
    const f = await prisma.factura.create({
      data: {
        ...data,
        lineas: { create: lineas.map((l, i) => ({ concepto: l.concepto, base: l.base, orden: i })) },
      },
    });
    id = f.id;
    // Bump del correlativo del socio si el número usado alcanza/supera el próximo.
    const m = numero.match(/(\d+)\s*$/);
    const n = m ? parseInt(m[1], 10) : 0;
    const cfg = await prisma.socioConfig.findUnique({ where: { socio: input.socio } });
    if (cfg && n >= cfg.proximoNumero) {
      await prisma.socioConfig.update({ where: { socio: input.socio }, data: { proximoNumero: n + 1 } });
    }
  }

  revalidatePath("/facturacion");
  revalidatePath("/expedientes");
  if (input.expedienteId) revalidatePath(`/expedientes/${input.expedienteId}`);
  revalidatePath("/contabilidad");
  return { ok: true, id };
}

export async function deleteFactura(id: string) {
  await requireUser();
  await prisma.factura.delete({ where: { id } });
  revalidatePath("/facturacion");
  revalidatePath("/expedientes");
}
