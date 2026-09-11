"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { EntidadGasto } from "@/lib/domain";
import { requireUser } from "@/lib/auth-guard";

function isoToDate(iso: string): Date {
  const s = (iso || "").slice(0, 10);
  return new Date((/^\d{4}-\d{2}-\d{2}$/.test(s) ? s : new Date().toISOString().slice(0, 10)) + "T00:00:00.000Z");
}

function revalidate() {
  revalidatePath("/gastos");
  revalidatePath("/contabilidad");
}

export interface NuevoGasto {
  concepto: string;
  importe: number;
  fecha: string;
  entidad: EntidadGasto;
}

export async function addGasto(input: NuevoGasto): Promise<string> {
  await requireUser();
  const g = await prisma.gasto.create({
    data: {
      concepto: input.concepto.trim(),
      importe: input.importe,
      fecha: isoToDate(input.fecha),
      entidad: input.entidad,
      compensado: false,
      noComputable: false,
    },
  });
  revalidate();
  return g.id;
}

export interface GastoPatch {
  concepto?: string;
  importe?: number;
  fecha?: string;
  entidad?: EntidadGasto;
  compensado?: boolean;
  noComputable?: boolean;
}

export async function updateGasto(id: string, patch: GastoPatch) {
  await requireUser();
  const data: Record<string, unknown> = {};
  if (patch.concepto !== undefined) data.concepto = patch.concepto;
  if (patch.importe !== undefined) data.importe = patch.importe;
  if (patch.fecha !== undefined) data.fecha = isoToDate(patch.fecha);
  if (patch.entidad !== undefined) data.entidad = patch.entidad;
  if (patch.compensado !== undefined) data.compensado = patch.compensado;
  if (patch.noComputable !== undefined) data.noComputable = patch.noComputable;
  await prisma.gasto.update({ where: { id }, data });
  revalidate();
}

export async function deleteGasto(id: string) {
  await requireUser();
  await prisma.gasto.delete({ where: { id } });
  revalidate();
}
