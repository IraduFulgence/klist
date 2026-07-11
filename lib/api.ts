const API_URL ="http://127.0.0.1:8000/api";
const TOKEN_KEY = "token";

export type User = {
  id: number;
  name: string;
  email: string;
};

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: number;
  user_id: number;
  project_id: number | null;
  assignee_id: number | null;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  created_at: string;
  updated_at: string;
  assignee?: User | null;
  project?: { id: number; name: string; color: string } | null;
};

export type Project = {
  id: number;
  owner_id: number;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  owner?: User;
  members?: (User & { pivot: { role: "owner" | "member" } })[];
  tasks_count?: number;
  members_count?: number;
};

export type Activity = {
  id: number;
  user_id: number;
  task_id: number | null;
  project_id: number | null;
  action: "created" | "updated" | "completed" | "reopened" | "deleted" | "assigned";
  task_title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  user?: { id: number; name: string };
  project?: { id: number; name: string; color: string } | null;
};

export type TaskInput = {
  title: string;
  description?: string;
  due_date?: string;
  project_id?: number;
  assignee_id?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
};

export type TaskUpdate = Partial<TaskInput & { completed: boolean }>;

export type ProjectInput = {
  name: string;
  description?: string;
  color?: string;
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

export async function getTasks(params?: { project_id?: number }): Promise<Task[]> {
  const query = params?.project_id ? `?project_id=${params.project_id}` : "";
  return request<Task[]>(`/tasks${query}`);
}

export async function createTask(body: TaskInput): Promise<Task> {
  return request<Task>("/tasks", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateTask(id: number, body: TaskUpdate): Promise<Task> {
  return request<Task>(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteTask(id: number): Promise<void> {
  await request(`/tasks/${id}`, { method: "DELETE" });
}

export async function getActivities(): Promise<Activity[]> {
  return request<Activity[]>("/activities");
}

export async function getProjects(): Promise<Project[]> {
  return request<Project[]>("/projects");
}

export async function getProject(id: number): Promise<Project> {
  return request<Project>(`/projects/${id}`);
}

export async function createProject(body: ProjectInput): Promise<Project> {
  return request<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateProject(id: number, body: Partial<ProjectInput>): Promise<Project> {
  return request<Project>(`/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteProject(id: number): Promise<void> {
  await request(`/projects/${id}`, { method: "DELETE" });
}

export async function getProjectMembers(projectId: number): Promise<(User & { pivot: { role: string } })[]> {
  return request(`/projects/${projectId}/members`);
}

export async function addProjectMember(
  projectId: number,
  email: string
): Promise<(User & { pivot: { role: string } })[]> {
  return request(`/projects/${projectId}/members`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function removeProjectMember(projectId: number, userId: number): Promise<void> {
  await request(`/projects/${projectId}/members/${userId}`, { method: "DELETE" });
}

export type BoardColumns = Record<TaskStatus, number[]>;

export async function reorderTasks(projectId: number, columns: BoardColumns): Promise<Task[]> {
  return request<Task[]>(`/projects/${projectId}/reorder`, {
    method: "POST",
    body: JSON.stringify({ columns }),
  });
}
