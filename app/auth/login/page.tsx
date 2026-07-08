import LoginComponent from "@/components/auth/LoginComponent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login-Klist",
  description: "Login to your account",
};

export default function LoginPage() {
  return <LoginComponent />;
}