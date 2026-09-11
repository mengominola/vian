import { getExpedientes, getSocioConfigs } from "@/lib/data";
import { nextNumero, socioKey, type SocioKey } from "@/lib/domain";
import { moneyPlain, round2, todayISO } from "@/lib/format";
import FacturaForm, { type FormState } from "../FacturaForm";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ expediente?: string; pago?: string; socio?: string }>;
}) {
  const sp = await searchParams;
  const expedientes = await getExpedientes();
  const configs = await getSocioConfigs();

  const nextBy: Record<SocioKey, string> = {
    ana: (() => { const c = configs.find((x) => x.socio === "ana"); return c ? nextNumero(c) : "2026/001"; })(),
    jorge: (() => { const c = configs.find((x) => x.socio === "jorge"); return c ? nextNumero(c) : "2026/001"; })(),
  };

  const exp = sp.expediente ? expedientes.find((e) => e.id === sp.expediente) : null;
  const pago = exp && sp.pago ? exp.pagos.find((p) => p.id === sp.pago) : null;

  let initial: FormState;
  let returnTo = "/facturacion";
  let subtitle = "Factura aislada";

  if (exp && pago) {
    const socio = socioKey(pago.facturaPor ?? "socio1");
    initial = {
      id: null,
      socio,
      numero: nextBy[socio],
      fecha: pago.fecha ?? todayISO(),
      estado: "draft",
      expedienteId: exp.id,
      pagoId: pago.id,
      cliente: { nombre: exp.cliente.nombre, direccion: exp.cliente.direccion, email: exp.cliente.email, telefono: exp.cliente.telefono, dni: exp.cliente.dni },
      lineas: [{ concepto: exp.name, base: moneyPlain(round2(pago.importe / 1.21)) }],
      ivaOn: true,
      ivaRate: "21",
      irpfOn: false,
      irpfRate: "15",
    };
    returnTo = `/expedientes/${exp.id}`;
    subtitle = `Hereda datos de ${exp.name}`;
  } else {
    const socio: SocioKey = sp.socio === "jorge" ? "jorge" : "ana";
    initial = {
      id: null,
      socio,
      numero: nextBy[socio],
      fecha: todayISO(),
      estado: "draft",
      expedienteId: "",
      pagoId: "",
      cliente: { nombre: "", direccion: "", email: "", telefono: "", dni: "" },
      lineas: [{ concepto: "", base: "" }],
      ivaOn: true,
      ivaRate: "21",
      irpfOn: false,
      irpfRate: "15",
    };
  }

  return <FacturaForm initial={initial} expedientes={expedientes} nextNumeroBySocio={nextBy} returnTo={returnTo} subtitle={subtitle} />;
}
