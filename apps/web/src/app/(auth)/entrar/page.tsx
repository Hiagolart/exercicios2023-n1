import type { Metadata } from "next";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Entrar" };

export default function SignInPage() {
  return <AuthForm mode="entrar" />;
}
