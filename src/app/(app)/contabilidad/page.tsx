import { getExpedientes, getGastos } from "@/lib/data";
import Contabilidad from "./Contabilidad";

export default async function Page() {
  const [expedientes, gastos] = await Promise.all([getExpedientes(), getGastos()]);
  return <Contabilidad expedientes={expedientes} gastos={gastos} />;
}
