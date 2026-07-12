const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
const TOKEN_KEY = "token";

export type Role = "admin" | "project_manager" | "user";

export type Department = {
  id: number;
  name: string;
  users_count?: number;
};

export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  telephone?: string | null;
  department_id: number | null;
  department?: Department | null;
  is_active?: boolean;
};

export type TaskStatus = "todo" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: number;
  user_id: number;
  project_id: number | null;
  assignee_id: number | null;
  milestone_id: number | null;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  estimated_hours: number | null;
  actual_hours: number | null;
  created_at: string;
  updated_at: string;
  assignee?: User | null;
  project?: { id: number; name: string; color: string } | null;
};

export type ProjectStatus = "not_started" | "in_progress" | "completed" | "cancelled" | "onhold";
export type ProjectPriority = "low" | "medium" | "high" | "critical";

export type Project = {
  id: number;
  name: string;
  description: string | null;
  color: string;
  manager_id: number;
  manager?: User;
  start_date: string;
  end_date: string;
  status: ProjectStatus;
  budget: string | number;
  priority: ProjectPriority;
  completion_percentage: string | number;
  created_at: string;
  updated_at: string;
  members?: (User & { pivot: { role: "member" } })[];
  tasks_count?: number;
  members_count?: number;
};

export type Milestone = {
  id: number;
  project_id: number;
  title: string;
  due_date: string;
  status: "not_started" | "in_progress" | "completed" | "cancelled" | "onhold";
  completion_percentage: string | number;
  color: string;
};

export type ProjectFile = {
  id: number;
  project_id: number;
  task_id: number | null;
  file_name: string;
  file_path: string;
  uploaded_by: number;
  uploader?: { id: number; name: string; email: string };
  task?: { id: number; title: string } | null;
  created_at: string;
};

export type Comment = {
  id: number;
  task_id: number;
  user_id: number;
  content: string;
  user?: { id: number; name: string; email: string };
  created_at: string;
};

export type ProjectExpense = {
  id: number;
  project_id: number;
  expense_name: string;
  amount: number;
  expense_date: string;
  added_by: number;
  addedBy?: { id: number; name: string; email: string };
  description: string | null;
  status: "pending" | "approved" | "rejected";
  notes: string | null;
};

export type OrganizationReport = {
  total_projects: number;
  total_employees: number;
  total_departments: number;
  tasks_completed_pct: number;
  overdue_tasks_count: number;
  projects_by_status: Record<string, number>;
};

export type ProjectReport = {
  budget: number;
  spent: number;
  remaining: number;
  milestones: Milestone[];
  team_workload: { user: { id: number; name: string }; open_tasks_count: number; completed_tasks_count: number }[];
  overdue_tasks: { id: number; title: string; due_date: string; assignee_id: number | null }[];
};

export type Settings = {
  id: number;
  company_name: string;
  logo_path: string | null;
  timezone: string;
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
  milestone_id?: number;
  estimated_hours?: number;
  actual_hours?: number;
};

export type TaskUpdate = Partial<TaskInput & { completed: boolean }>;

export type ProjectInput = {
  name: string;
  description?: string;
  color?: string;
  start_date: string;
  end_date: string;
  manager_id: number;
  status: ProjectStatus;
  budget: number;
  priority: ProjectPriority;
  owner: string;
  completion_percentage?: number;
};

export type ProjectUpdate = Partial<Omit<ProjectInput, "manager_id" | "owner">>;

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

async function upload<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
    body: formData,
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

export async function updateProject(id: number, body: ProjectUpdate): Promise<Project> {
  return request<Project>(`/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteProject(id: number): Promise<void> {
  await request(`/projects/${id}`, { method: "DELETE" });
}

export async function assignProjectManager(id: number, managerId: number): Promise<Project> {
  return request<Project>(`/projects/${id}/manager`, {
    method: "PATCH",
    body: JSON.stringify({ manager_id: managerId }),
  });
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

// Employees (admin)
export async function getEmployees(params?: { department_id?: number; role?: Role }): Promise<User[]> {
  const search = new URLSearchParams();
  if (params?.department_id) search.set("department_id", String(params.department_id));
  if (params?.role) search.set("role", params.role);
  const query = search.toString() ? `?${search}` : "";
  return request<User[]>(`/admin/users${query}`);
}

export async function createEmployee(body: {
  name: string;
  email: string;
  telephone: string;
  password: string;
  role: Role;
  department_id?: number;
}): Promise<User> {
  return request<User>("/admin/users", { method: "POST", body: JSON.stringify(body) });
}

export async function updateEmployee(
  id: number,
  body: Partial<{ name: string; telephone: string; role: Role; department_id: number | null }>
): Promise<User> {
  return request<User>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function setEmployeeActive(id: number, isActive: boolean): Promise<User> {
  return request<User>(`/admin/users/${id}/active`, {
    method: "PATCH",
    body: JSON.stringify({ is_active: isActive }),
  });
}

// Departments
export async function getDepartments(): Promise<Department[]> {
  return request<Department[]>("/departments");
}

export async function createDepartment(name: string): Promise<Department> {
  return request<Department>("/departments", { method: "POST", body: JSON.stringify({ name }) });
}

export async function updateDepartment(id: number, name: string): Promise<Department> {
  return request<Department>(`/departments/${id}`, { method: "PATCH", body: JSON.stringify({ name }) });
}

export async function deleteDepartment(id: number): Promise<void> {
  await request(`/departments/${id}`, { method: "DELETE" });
}

// Milestones
export async function getMilestones(projectId: number): Promise<Milestone[]> {
  return request<Milestone[]>(`/projects/${projectId}/milestones`);
}

export async function createMilestone(
  projectId: number,
  body: { title: string; due_date: string; status?: Milestone["status"]; completion_percentage?: number; color?: string }
): Promise<Milestone> {
  return request<Milestone>(`/projects/${projectId}/milestones`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateMilestone(
  id: number,
  body: Partial<{ title: string; due_date: string; status: Milestone["status"]; completion_percentage: number; color: string }>
): Promise<Milestone> {
  return request<Milestone>(`/milestones/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteMilestone(id: number): Promise<void> {
  await request(`/milestones/${id}`, { method: "DELETE" });
}

// Documents
export async function getProjectFiles(projectId: number, taskId?: number): Promise<ProjectFile[]> {
  const query = taskId ? `?task_id=${taskId}` : "";
  return request<ProjectFile[]>(`/projects/${projectId}/files${query}`);
}

export async function uploadProjectFile(projectId: number, file: File, taskId?: number): Promise<ProjectFile> {
  const formData = new FormData();
  formData.append("file", file);
  if (taskId) formData.append("task_id", String(taskId));
  return upload<ProjectFile>(`/projects/${projectId}/files`, formData);
}

export function getFileDownloadUrl(fileId: number): string {
  return `${API_URL}/files/${fileId}/download`;
}

export async function deleteProjectFile(fileId: number): Promise<void> {
  await request(`/files/${fileId}`, { method: "DELETE" });
}

// Comments
export async function getComments(taskId: number): Promise<Comment[]> {
  return request<Comment[]>(`/tasks/${taskId}/comments`);
}

export async function createComment(taskId: number, content: string): Promise<Comment> {
  return request<Comment>(`/tasks/${taskId}/comments`, { method: "POST", body: JSON.stringify({ content }) });
}

export async function deleteComment(id: number): Promise<void> {
  await request(`/comments/${id}`, { method: "DELETE" });
}

// Budget / Expenses
export async function getExpenses(projectId: number): Promise<ProjectExpense[]> {
  return request<ProjectExpense[]>(`/projects/${projectId}/expenses`);
}

export async function createExpense(
  projectId: number,
  body: { expense_name: string; amount: number; expense_date: string; description?: string; status?: ProjectExpense["status"]; notes?: string }
): Promise<ProjectExpense> {
  return request<ProjectExpense>(`/projects/${projectId}/expenses`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateExpense(
  id: number,
  body: Partial<{ expense_name: string; amount: number; expense_date: string; description: string; status: ProjectExpense["status"]; notes: string }>
): Promise<ProjectExpense> {
  return request<ProjectExpense>(`/expenses/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteExpense(id: number): Promise<void> {
  await request(`/expenses/${id}`, { method: "DELETE" });
}

// Reports
export async function getOrganizationReport(): Promise<OrganizationReport> {
  return request<OrganizationReport>("/reports/organization");
}

export async function getProjectReport(projectId: number): Promise<ProjectReport> {
  return request<ProjectReport>(`/reports/projects/${projectId}`);
}

// Settings
export async function getSettings(): Promise<Settings> {
  return request<Settings>("/settings");
}

export async function updateSettings(body: Partial<{ company_name: string; timezone: string }>): Promise<Settings> {
  return request<Settings>("/settings", { method: "PATCH", body: JSON.stringify(body) });
}
