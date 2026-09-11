import { getFactura, getExpedientes, getSocioConfigs } from "@/lib/data";
import { notFound } from "next/navigation";
import { nextNumero, type SocioKey } from "@/lib/domain";
import { moneyPlain } from "@/lib/format";
import FacturaForm, { type FormState } from "../../FacturaForm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const factura = await getFactura(id);
  if (!factura) notFound();
  const expedientes = await getExpedientes();
  const configs = await getSocioConfigs();

  const nextBy: Record<SocioKey, string> = {
    ana: (() => { const c = configs.find((x) => x.socio === "ana"); return c ? nextNumero(c) : "2026/001"; })(),
    jorge: (() => { const c = configs.find((x) => x.socio === "jorge"); return c ? nextNumero(c) : "2026/001"; })(),
  };

  const initial: FormState = {
    id: factura.id,
    socio: factura.socio,
    numero: factura.numero,
    fecha: factura.fecha,
    estado: factura.estado,
    expedienteId: factura.expedienteId ?? "",
    pagoId: factura.pagoId ?? "",
    cliente: {
      nombre: factura.cliente.nombre,
      direccion: factura.cliente.direccion,
      email: factura.cliente.email,
      telefono: factura.cliente.telefono,
      dni: factura.cliente.dni,
    },
    lineas: factura.lineas.length
      ? factura.lineas.map((l) => ({ concepto: l.concepto, base: moneyPlain(l.base) }))
      : [{ concepto: "", base: "" }],
    ivaOn: factura.ivaRate > 0,
    ivaRate: String(factura.ivaRate > 0 ? factura.ivaRate : 21),
    irpfOn: factura.irpfRate > 0,
    irpfRate: String(factura.irpfRate > 0 ? factura.irpfRate : 15),
  };

  return (
    <FacturaForm
      initial={initial}
      expedientes={expedientes}
      nextNumeroBySocio={nextBy}
      returnTo={`/facturacion/${factura.id}`}
      subtitle={factura.expedienteNombre || "Factura aislada"}
    />
  );
}
