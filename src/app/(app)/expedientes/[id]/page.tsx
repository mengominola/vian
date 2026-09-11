import { getExpediente, getFacturasSinAsociar } from "@/lib/data";
import { notFound } from "next/navigation";
import ExpedienteDetail from "./ExpedienteDetail";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const { id } = await params;
  const { nuevo } = await searchParams;
  const e = await getExpediente(id);
  if (!e) notFound();
  const facturasSinAsociar = await getFacturasSinAsociar();
  return <ExpedienteDetail expediente={e} facturasSinAsociar={facturasSinAsociar} isNewInitial={nuevo === "1"} />;
}
