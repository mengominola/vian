"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { SocioKey } from "@/lib/domain";
import { requireUser } from "@/lib/auth-guard";

export interface SocioConfigPatch {
  nombre?: string;
  nif?: string;
  direccion?: string;
  cp?: string;
  email?: string;
  facturaSerie?: string;
  facturaAncho?: number;
  proximoNumero?: number;
}

export async function saveSocioConfig(socio: SocioKey, patch: SocioConfigPatch) {
  await requireUser();
  await prisma.socioConfig.update({ where: { socio }, data: patch });
  revalidatePath("/ajustes");
  revalidatePath("/facturacion");
}

export interface AppSettingsPatch {
  formaPagoTexto?: string;
  iban?: string;
}

/** Ajustes globales: texto de forma de pago e IBAN de la cuenta común. */
export async function saveAppSettings(patch: AppSettingsPatch) {
  await requireUser();
  await prisma.appSettings.upsert({
    where: { id: "app" },
    update: patch,
    create: { id: "app", ...patch },
  });
  revalidatePath("/ajustes");
  revalidatePath("/facturacion");
}
