import { getFactura, getSocioConfigs, getAppSettings } from "@/lib/data";
import { notFound } from "next/navigation";
import FacturaPreview from "./FacturaPreview";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const factura = await getFactura(id);
  if (!factura) notFound();
  const configs = await getSocioConfigs();
  const settings = await getAppSettings();
  const cfg = configs.find((c) => c.socio === factura.socio);
  const emisor = cfg
    ? { nombre: cfg.nombre, nif: cfg.nif, direccion: cfg.direccion, cp: cfg.cp }
    : { nombre: factura.socio === "ana" ? "Ana" : "Jorge", nif: "", direccion: "", cp: "" };
  return <FacturaPreview factura={factura} emisor={emisor} formaPago={settings.formaPagoTexto} iban={settings.iban} />;
}
