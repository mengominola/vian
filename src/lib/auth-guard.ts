import { auth } from "@/auth";
import type { SocioKey } from "@/lib/domain";

export interface CurrentUser {
  id: string;
  socio: SocioKey;
  name: string;
  email: string;
}

/** Exige sesión en server actions / componentes servidor. Lanza si no hay. */
export async function requireUser(): Promise<CurrentUser> {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");
  return {
    id: session.user.id,
    socio: session.user.socio,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
  };
}
