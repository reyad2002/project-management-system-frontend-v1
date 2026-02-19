import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE, TOKEN_KEY } from "./config";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      Cookies.remove(TOKEN_KEY);
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ user: User; token: string }>("/api/auth/login", { email, password }),
  logout: () => api.post("/api/auth/logout"),
  me: () => api.get<User>("/api/auth/me"),
};

// Clients
export const clientsApi = {
  list: (params?: { page?: number; limit?: number; q?: string }) =>
    api.get<{ clients: Client[]; pagination: Pagination }>("/api/clients", { params }),
  shortList: () => api.get<{ clients: { id: string; name: string }[] }>("/api/clients/shortList"),
  get: (id: string) => api.get<Client>(`/api/clients/${id}`),
  create: (data: CreateClientInput) => api.post<Client>("/api/clients", data),
  update: (id: string, data: Partial<CreateClientInput>) => api.put<Client>(`/api/clients/${id}`, data),
  delete: (id: string) => api.delete(`/api/clients/${id}`),
};

// Projects
export const projectsApi = {
  list: (params?: { page?: number; limit?: number; client_id?: string; status?: string; q?: string }) =>
    api.get<{ projects: Project[]; pagination: Pagination }>("/api/projects", { params }),
  shortList: () => api.get<{ projects: { id: string; title: string }[] }>("/api/projects/shortList"),
  get: (id: string) => api.get<Project>(`/api/projects/${id}`),
  create: (data: CreateProjectInput) => api.post<Project>("/api/projects", data),
  update: (id: string, data: Partial<CreateProjectInput>) => api.put<Project>(`/api/projects/${id}`, data),
  delete: (id: string) => api.delete(`/api/projects/${id}`),
  payments: (id: string) => api.get<{ payments: Payment[] }>(`/api/projects/${id}/payments`),
};

// Payments
export const paymentsApi = {
  list: (params?: { page?: number; limit?: number; project_id?: string; client_id?: string }) =>
    api.get<{ payments: Payment[]; pagination: Pagination }>("/api/payments", { params }),
  get: (id: string) => api.get<Payment>(`/api/payments/${id}`),
  create: (data: CreatePaymentInput) => api.post<Payment>("/api/payments", data),
  update: (id: string, data: Partial<CreatePaymentInput>) => api.put<Payment>(`/api/payments/${id}`, data),
  delete: (id: string) => api.delete(`/api/payments/${id}`),
};

// Expenses
export const expensesApi = {
  list: (params?: { page?: number; limit?: number; type?: string; from_date?: string; to_date?: string; q?: string }) =>
    api.get<{ expenses: Expense[]; pagination: Pagination }>("/api/expenses", { params }),
  get: (id: string) => api.get<Expense>(`/api/expenses/${id}`),
  create: (data: CreateExpenseInput) => api.post<Expense>("/api/expenses", data),
  update: (id: string, data: Partial<CreateExpenseInput>) => api.put<Expense>(`/api/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/api/expenses/${id}`),
};

// Statistics
export const statisticsApi = {
  dashboard: (params?: { from_date?: string; to_date?: string }) =>
    api.get<DashboardStats>("/api/statistics", { params }),
  financial: (params?: { from_date?: string; to_date?: string }) =>
    api.get<FinancialStats>("/api/statistics/financial", { params }),
  overview: () => api.get<OverviewStats>("/api/statistics/overview"),
};

// Types
export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  status: string;
  company_id: string;
  company?: { name: string };
  created_at?: string;
}

export interface Client {
  id: string;
  created_at: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  feedback: string | null;
  company_id: string;
  created_by: string;
}

export interface CreateClientInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  feedback?: string;
}

export type ProjectStatus = "draft" | "active" | "on_hold" | "cancelled" | "completed";
export interface Project {
  id: string;
  created_at: string;
  company_id: string;
  client_id: string;
  title: string;
  details: string | null;
  start_date: string | null;
  due_date: string | null;
  price: number | null;
  status: ProjectStatus;
  created_by: string;
}

export interface CreateProjectInput {
  client_id: string;
  title: string;
  details?: string;
  start_date?: string;
  due_date?: string;
  price?: number;
  status?: ProjectStatus;
}

export type PaymentMethod = "cash" | "bank_transfer" | "credit_card" | "other";
export interface Payment {
  id: string;
  company_id: string;
  project_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  notes: string | null;
  created_at: string;
}

export interface CreatePaymentInput {
  project_id: string;
  amount: number;
  payment_date?: string;
  payment_method: PaymentMethod;
  notes?: string;
}

export type ExpenseType = "direct" | "operational";
export interface Expense {
  id: string;
  company_id: string;
  amount: number;
  expense_date: string;
  title: string;
  description: string | null;
  type: ExpenseType;
  created_at: string;
}

export interface CreateExpenseInput {
  amount: number;
  expense_date?: string;
  title: string;
  description?: string;
  type: ExpenseType;
}

export interface DashboardStats {
  overview: {
    totalClients: number;
    totalProjects: number;
    totalProjectValue: number;
    totalPaymentsReceived: number;
    totalPaymentsCount: number;
    totalExpenses: number;
    totalExpensesCount: number;
    dateRange: { from_date: string; to_date: string } | null;
  };
  projectsByStatus: Record<string, number>;
  paymentsSummary: { total: number; count: number };
  expensesSummary: {
    total: number;
    count: number;
    byType: { direct: number; operational: number };
  };
  financial: FinancialStats;
}

export interface FinancialStats {
  totalRevenue: number;
  directExpenses: number;
  operationalExpenses: number;
  totalExpenses: number;
  grossProfit: number;
  grossMargin: { amount: number; percent: number };
  operatingIncome: number;
  operatingMargin: { amount: number; percent: number };
  netProfit: number;
  profitMargin: { amount: number; percent: number };
  dateRange?: { from_date: string; to_date: string } | null;
}

export interface OverviewStats {
  totalClients: number;
  totalProjects: number;
  totalPaymentsCount: number;
  totalExpensesCount: number;
}
