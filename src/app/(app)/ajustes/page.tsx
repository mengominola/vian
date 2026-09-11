import { getSocioConfigs, getAppSettings } from "@/lib/data";
import Ajustes from "./Ajustes";
import type { SocioConfigDTO } from "@/lib/domain";

export default async function Page() {
  const [configs, settings] = await Promise.all([getSocioConfigs(), getAppSettings()]);
  const byKey = (k: "ana" | "jorge"): SocioConfigDTO =>
    configs.find((c) => c.socio === k) ?? {
      socio: k,
      nombre: k === "ana" ? "Ana" : "Jorge",
      nif: "", direccion: "", cp: "", email: "",
      facturaSerie: "2026/", facturaAncho: 3, proximoNumero: 1,
    };
  return <Ajustes ana={byKey("ana")} jorge={byKey("jorge")} formaPago={settings.formaPagoTexto} iban={settings.iban} />;
}
