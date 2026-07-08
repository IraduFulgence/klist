const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message ?? "Request failed");
  return data as T;
}

export async function login(body: { email: string; password: string }) {
  const data = await request<{ user: unknown; token: string }>("/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
  localStorage.setItem("token", data.token);
  return data;
}

export async function register(body: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}) {
  const data = await request<{ user: unknown; token: string }>("/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
  localStorage.setItem("token", data.token);
  return data;
}