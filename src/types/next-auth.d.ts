import type { DefaultSession } from "next-auth";
import type { SocioKey } from "@/lib/domain";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      socio: SocioKey;
    } & DefaultSession["user"];
  }
  interface User {
    socio: SocioKey;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    socio?: SocioKey;
    uid?: string;
  }
}
