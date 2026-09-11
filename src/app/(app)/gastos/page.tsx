import { getGastos } from "@/lib/data";
import Gastos from "./Gastos";

export default async function Page() {
  const gastos = await getGastos();
  return <Gastos gastos={gastos} />;
}
