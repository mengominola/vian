"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { REPARTO_DEFAULT } from "@/lib/domain";
import { requireUser } from "@/lib/auth-guard";

// ISO "YYYY-MM-DD" -> Date (UTC medianoche). "" / null -> null.
function isoToDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const s = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return new Date(s + "T00:00:00.000Z");
}

function revalidateCore() {
  revalidatePath("/expedientes");
  revalidatePath("/facturacion");
  revalidatePath("/contabilidad");
}

// ── Ediciones en línea (lista) ───────────────────────────────────────────────

export async function setEstado(id: string, estado: string) {
  await requireUser();
  await prisma.expediente.update({ where: { id }, data: { estado } });
  revalidatePath("/expedientes");
  revalidatePath(`/expedientes/${id}`);
  revalidatePath("/facturacion");
}

export async function toggleSeguro(id: string) {
  await requireUser();
  const e = await prisma.expediente.findUnique({ where: { id }, select: { seguro: true } });
  if (!e) return;
  await prisma.expediente.update({ where: { id }, data: { seguro: !e.seguro } });
  revalidatePath("/expedientes");
  revalidatePath(`/expedientes/${id}`);
}

export async function setPrioridad(id: string, prioridad: number | null) {
  await requireUser();
  await prisma.expediente.update({ where: { id }, data: { prioridad } });
  revalidatePath("/expedientes");
  revalidatePath(`/expedientes/${id}`);
}

// ── Crear / descartar ────────────────────────────────────────────────────────

export async function createExpediente(): Promise<string> {
  await requireUser();
  const e = await prisma.expediente.create({
    data: { name: "", estado: "", prioridad: null, presupuesto: null, seguro: false },
  });
  revalidatePath("/expedientes");
  return e.id;
}

export async function deleteExpediente(id: string) {
  await requireUser();
  await prisma.expediente.delete({ where: { id } });
  revalidateCore();
}

// ── Editar detalle (persistencia inmediata) ──────────────────────────────────

export interface PatchExpedienteInput {
  name?: string;
  estado?: string;
  prioridad?: number | null;
  presupuesto?: number | null;
  seguro?: boolean;
  clienteNombre?: string;
  clienteDireccion?: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  clienteDni?: string;
  clienteNotas?: string;
}

/** Parche granular de un expediente (persistencia inmediata desde el detalle). */
export async function patchExpediente(id: string, patch: PatchExpedienteInput) {
  await requireUser();
  await prisma.expediente.update({ where: { id }, data: patch });
  revalidateCore();
  revalidatePath(`/expedientes/${id}`);
}

// ── Pagos ────────────────────────────────────────────────────────────────────

export async function addPago(expedienteId: string): Promise<string> {
  await requireUser();
  const count = await prisma.pago.count({ where: { expedienteId } });
  const pago = await prisma.pago.create({
    data: {
      expedienteId,
      orden: count,
      importe: 0,
      cobrado: false,
      fecha: null,
      facturaPor: null,
      s1: 0,
      s2: 0,
      emp: 0,
    },
  });
  revalidatePath(`/expedientes/${expedienteId}`);
  return pago.id;
}

export interface PagoPatch {
  importe?: number;
  fecha?: string | null;
  facturaPor?: "socio1" | "socio2" | null;
  s1?: number;
  s2?: number;
  emp?: number;
}

export async function updatePago(pagoId: string, patch: PagoPatch) {
  await requireUser();
  const data: Record<string, unknown> = {};
  if (patch.importe !== undefined) data.importe = patch.importe;
  if (patch.fecha !== undefined) data.fecha = isoToDate(patch.fecha);
  if (patch.facturaPor !== undefined) data.facturaPor = patch.facturaPor;
  if (patch.s1 !== undefined) data.s1 = patch.s1;
  if (patch.s2 !== undefined) data.s2 = patch.s2;
  if (patch.emp !== undefined) data.emp = patch.emp;
  const pago = await prisma.pago.update({ where: { id: pagoId }, data });
  revalidatePath(`/expedientes/${pago.expedienteId}`);
  revalidatePath("/contabilidad");
  revalidatePath("/expedientes");
}

export async function removePago(pagoId: string) {
  await requireUser();
  const pago = await prisma.pago.delete({ where: { id: pagoId } });
  revalidatePath(`/expedientes/${pago.expedienteId}`);
  revalidateCore();
}

/** Marca/desmarca cobrado. Al cobrar fija fecha (hoy si vacía), socio y reparto por defecto. */
export async function toggleCobrado(pagoId: string) {
  await requireUser();
  const pago = await prisma.pago.findUnique({ where: { id: pagoId } });
  if (!pago) return;
  if (pago.cobrado) {
    await prisma.pago.update({ where: { id: pagoId }, data: { cobrado: false } });
  } else {
    const hasRep = (pago.s1 || 0) + (pago.s2 || 0) + (pago.emp || 0) > 0;
    const today = new Date();
    const iso = today.toISOString().slice(0, 10);
    await prisma.pago.update({
      where: { id: pagoId },
      data: {
        cobrado: true,
        fecha: pago.fecha ?? isoToDate(iso),
        facturaPor: pago.facturaPor ?? "socio1",
        s1: hasRep ? pago.s1 : REPARTO_DEFAULT.s1,
        s2: hasRep ? pago.s2 : REPARTO_DEFAULT.s2,
        emp: hasRep ? pago.emp : REPARTO_DEFAULT.emp,
      },
    });
  }
  revalidatePath(`/expedientes/${pago.expedienteId}`);
  revalidatePath("/contabilidad");
  revalidatePath("/expedientes");
}

// ── Asociación de facturas ───────────────────────────────────────────────────

export async function associateFactura(expedienteId: string, pagoId: string, facturaId: string) {
  await requireUser();
  const f = await prisma.factura.findUnique({ where: { id: facturaId } });
  if (!f || f.expedienteId) return; // solo facturas sin asociar
  await prisma.factura.update({ where: { id: facturaId }, data: { expedienteId, pagoId } });
  revalidatePath(`/expedientes/${expedienteId}`);
  revalidatePath("/facturacion");
}

export async function unlinkFactura(pagoId: string) {
  await requireUser();
  const f = await prisma.factura.findUnique({ where: { pagoId } });
  const pago = await prisma.pago.findUnique({ where: { id: pagoId }, select: { expedienteId: true } });
  if (f) await prisma.factura.update({ where: { id: f.id }, data: { expedienteId: null, pagoId: null } });
  if (pago) revalidatePath(`/expedientes/${pago.expedienteId}`);
  revalidatePath("/facturacion");
}
