import { getFacturas } from "@/lib/data";
import { requireUser } from "@/lib/auth-guard";
import FacturasList from "./FacturasList";

export default async function Page() {
  const [facturas, user] = await Promise.all([getFacturas(), requireUser()]);
  return <FacturasList facturas={facturas} defaultSocio={user.socio} />;
}
