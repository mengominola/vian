import { getExpedientes } from "@/lib/data";
import ExpedientesList from "./ExpedientesList";

export default async function Page() {
  const expedientes = await getExpedientes();
  return <ExpedientesList expedientes={expedientes} />;
}
