import { getFacturas } from "@/lib/data";
import FacturasList from "./FacturasList";

export default async function Page() {
  const facturas = await getFacturas();
  return <FacturasList facturas={facturas} />;
}
