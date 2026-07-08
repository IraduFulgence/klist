"use client";
import AuthLayout from "./AuthLayout";
import { AuthInput } from "./AuthInput";
import Link from "next/link";
import { useState } from "react";
export default function RegisterComponent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
  };

  return (
    <AuthLayout title="Register" subtitle="Create your account">
        <form>
            <AuthInput label="Name" type="text" placeholder="Name" />
            <AuthInput label="Email" type="email" placeholder="Email" />
            <AuthInput label="Password" type="password" placeholder="Password" />
            <AuthInput label="Confirm Password" type="password" placeholder="Confirm Password" />
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-900 px-4 py-2 mt-4 text-sm font-medium text-white hover:bg-blue-900 disabled:opacity-50">
          {loading ? "Registering…" : "Register"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-zinc-950 dark:text-zinc-50">
          Login
        </Link>
      </p>
    </AuthLayout>
  ) ;
}