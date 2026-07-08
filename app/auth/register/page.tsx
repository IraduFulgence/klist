import RegisterComponent from "@/components/auth/RegisterComponent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register-Klist",
  description: "Create your account to start using Klist",
};

export default function RegisterPage() {
  return <RegisterComponent />;
}