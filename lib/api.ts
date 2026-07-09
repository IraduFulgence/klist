const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
const TOKEN_KEY = "token";

export type User = {
  id: number;
  name: string;
  email: string;
};

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message ?? "Request failed");
  return data as T;
}

export async function getUser(): Promise<User> {
  return request<User>("/user");
}

export async function login(body: { email: string; password: string }) {
  const data = await request<{ user: User; token: string }>("/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
  setToken(data.token);
  return data;
}

export async function register(body: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}) {
  const data = await request<{ user: User; token: string }>("/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
  setToken(data.token);
  return data;
}

export async function logout() {
  try {
    await request("/logout", { method: "POST" });
  } finally {
    clearToken();
  }
}