"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

/** Login con credenciales. Devuelve mensaje de error o redirige a /expedientes. */
export async function authenticate(_prev: string | undefined, formData: FormData): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/expedientes",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Email o contraseña incorrectos.";
    }
    throw error; // deja pasar el redirect de éxito (NEXT_REDIRECT)
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
