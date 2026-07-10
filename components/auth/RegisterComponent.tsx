"use client";
import AuthLayout from "./AuthLayout";
import { AuthInput } from "./AuthInput";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function RegisterComponent() {
  const router = useRouter();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  function updateField(field: keyof typeof formData) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
      });
      router.push("/dashboard/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Register" subtitle="Create your account">
        <form onSubmit={handleSubmit} className="space-y-4">
            <AuthInput label="Name" type="text" placeholder="Name" required value={formData.name} onChange={updateField("name")} />
            <AuthInput label="Email" type="email" placeholder="Email" required value={formData.email} onChange={updateField("email")} />
            <AuthInput label="Password" type="password" placeholder="Password" required value={formData.password} onChange={updateField("password")} />
            <AuthInput label="Confirm Password" type="password" placeholder="Confirm Password" required value={formData.confirmPassword} onChange={updateField("confirmPassword")} />
            {error && <p className="text-sm text-red-600">{error}</p>}
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
