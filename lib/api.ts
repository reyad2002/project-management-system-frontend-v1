import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE, TOKEN_KEY } from "./config";
import { publishAppError } from "./error-bus";

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
    } else {
      publishAppError(err);
    }
    return Promise.reject(err);
  },
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ user: User; token: string }>("/api/auth/login", {
      email,
      password,
    }),
  logout: () => api.post("/api/auth/logout"),
  me: () => api.get<User>("/api/auth/me"),
  changePassword: (current_password: string, new_password: string) =>
    api.post<{ message: string }>("/api/auth/change-password", { current_password, new_password }),
};

// Clients
export const clientsApi = {
  list: (params?: { page?: number; limit?: number; q?: string }) =>
    api.get<{ clients: Client[]; pagination: Pagination }>("/api/clients", {
      params,
    }),
  shortList: () =>
    api.get<{ clients: { id: string; name: string }[] }>(
      "/api/clients/shortList",
    ),
  get: (id: string) => api.get<Client>(`/api/clients/${id}`),
  getPaymentSummary: (id: string) =>
    api.get<ClientPaymentSummary>(`/api/clients/${id}/payment-summary`),
  create: (data: CreateClientInput) => api.post<Client>("/api/clients", data),
  update: (id: string, data: Partial<CreateClientInput>) =>
    api.put<Client>(`/api/clients/${id}`, data),
  delete: (id: string) => api.delete(`/api/clients/${id}`),
};

// Projects
export const projectsApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    client_id?: string;
    status?: string;
    type?: string;
    q?: string;
  }) =>
    api.get<{ projects: Project[]; pagination: Pagination }>("/api/projects", {
      params,
    }),
  shortList: () =>
    api.get<{ projects: { id: string; title: string }[] }>(
      "/api/projects/shortList",
    ),
  get: (id: string) => api.get<Project>(`/api/projects/${id}`),
  create: (data: CreateProjectInput) =>
    api.post<Project>("/api/projects", data),
  update: (id: string, data: Partial<CreateProjectInput>) =>
    api.put<Project>(`/api/projects/${id}`, data),
  delete: (id: string) => api.delete(`/api/projects/${id}`),
  payments: (id: string) =>
    api.get<{ payments: Payment[] }>(`/api/projects/${id}/payments`),
  phases: {
    list: (projectId: string, params?: { page?: number; limit?: number }) =>
      api.get<{ phases: Phase[]; pagination: Pagination }>(
        `/api/projects/${projectId}/phases`,
        { params },
      ),
    get: (projectId: string, phaseId: string) =>
      api.get<Phase>(`/api/projects/${projectId}/phases/${phaseId}`),
    create: (projectId: string, data: CreatePhaseInput) =>
      api.post<Phase>(`/api/projects/${projectId}/phases`, data),
    update: (projectId: string, phaseId: string, data: UpdatePhaseInput) =>
      api.put<Phase>(`/api/projects/${projectId}/phases/${phaseId}`, data),
    delete: (projectId: string, phaseId: string) =>
      api.delete(`/api/projects/${projectId}/phases/${phaseId}`),
  },
};

// Invoices
export const invoicesApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    project_id?: string;
    client_id?: string;
    status?: InvoiceStatus;
    from_date?: string;
    to_date?: string;
  }) =>
    api.get<{ invoices: Invoice[]; pagination: Pagination }>("/api/invoices", {
      params,
    }),
  get: (id: string) => api.get<Invoice>(`/api/invoices/${id}`),
  create: (data: CreateInvoiceInput) =>
    api.post<Invoice>("/api/invoices", data),
  update: (id: string, data: Partial<CreateInvoiceInput>) =>
    api.put<Invoice>(`/api/invoices/${id}`, data),
  send: (id: string) => api.post<Invoice>(`/api/invoices/${id}/send`),
  cancel: (id: string, reason?: string) =>
    api.post<Invoice>(`/api/invoices/${id}/cancel`, { reason }),
};

// Vendors
export const vendorsApi = {
  list: (params?: { page?: number; limit?: number; q?: string }) =>
    api.get<{ vendors: Vendor[]; pagination: Pagination }>("/api/vendors", {
      params,
    }),
  shortList: () =>
    api.get<{ vendors: { id: string; name: string }[] }>(
      "/api/vendors/shortList",
    ),
  get: (id: string) => api.get<Vendor>(`/api/vendors/${id}`),
  create: (data: CreateVendorInput) => api.post<Vendor>("/api/vendors", data),
  update: (id: string, data: Partial<CreateVendorInput>) =>
    api.put<Vendor>(`/api/vendors/${id}`, data),
  delete: (id: string) => api.delete(`/api/vendors/${id}`),
};

// Vendor Bills
export const vendorBillsApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    vendor_id?: string;
    project_id?: string;
    status?: VendorBillStatus;
  }) =>
    api.get<{ vendorBills: VendorBill[]; pagination: Pagination }>(
      "/api/vendor-bills",
      { params },
    ),
  get: (id: string) => api.get<VendorBill>(`/api/vendor-bills/${id}`),
  create: (data: CreateVendorBillInput) =>
    api.post<VendorBill>("/api/vendor-bills", data),
  update: (id: string, data: Partial<CreateVendorBillInput>) =>
    api.put<VendorBill>(`/api/vendor-bills/${id}`, data),
  delete: (id: string) => api.delete(`/api/vendor-bills/${id}`),
  addPayment: (id: string, data: CreateVendorBillPaymentInput) =>
    api.post<VendorBill>(`/api/vendor-bills/${id}/payments`, data),
};

// Payments
export const paymentsApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    project_id?: string;
    client_id?: string;
    from_date?: string;
    to_date?: string;
  }) =>
    api.get<{ payments: Payment[]; pagination: Pagination }>("/api/payments", {
      params,
    }),
  get: (id: string) => api.get<Payment>(`/api/payments/${id}`),
  create: (data: CreatePaymentInput) =>
    api.post<Payment>("/api/payments", data),
  update: (id: string, data: Partial<CreatePaymentInput>) =>
    api.put<Payment>(`/api/payments/${id}`, data),
  delete: (id: string) => api.delete(`/api/payments/${id}`),
};

// Expenses
export const expensesApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    cost_category?: string;
    project_id?: string;
    from_date?: string;
    to_date?: string;
    q?: string;
  }) =>
    api.get<{ expenses: Expense[]; pagination: Pagination }>("/api/expenses", {
      params,
    }),
  get: (id: string) => api.get<Expense>(`/api/expenses/${id}`),
  create: (data: CreateExpenseInput) =>
    api.post<Expense>("/api/expenses", data),
  update: (id: string, data: Partial<CreateExpenseInput>) =>
    api.put<Expense>(`/api/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/api/expenses/${id}`),
};

// Statistics
export const statisticsApi = {
  dashboard: (params?: { from_date?: string; to_date?: string }) =>
    api.get<DashboardStats>("/api/statistics", { params }),
  financial: (params?: {
    from_date?: string;
    to_date?: string;
    basis?: "accrual" | "cash";
  }) =>
    api.get<FinancialStats & { basis?: "accrual" | "cash" }>(
      "/api/statistics/financial",
      { params },
    ),
  overview: () => api.get<OverviewStats>("/api/statistics/overview"),
  arAging: (params?: { client_id?: string; project_id?: string }) =>
    api.get<AgingReport>("/api/statistics/ar-aging", { params }),
  apAging: (params?: { vendor_id?: string; project_id?: string }) =>
    api.get<AgingReport>("/api/statistics/ap-aging", { params }),
  monthly: (year: number, withRows = false) =>
    api.get<YearReport>("/api/statistics/monthly", { params: { year, rows: withRows ? 1 : undefined } }),
  monthDetail: (month: string) => api.get<MonthDetail>(`/api/statistics/monthly/${month}`),
  projectProfitability: (params?: { project_id?: string }) =>
    api.get<
      ProjectProfitability | { projects: ProjectProfitability[]; pagination: Pagination }
    >("/api/statistics/project-profitability", { params }),
};

// Types
export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export type UserRole = "owner" | "admin" | "manager" | "accountant" | "member";

export interface User {
  id: string;
  name: string;
  email: string;
  status: string;
  role: UserRole;
  /** Set when an admin created the account or reset its password; the user must pick their own. */
  must_change_password?: boolean;
  last_login_at?: string | null;
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

export interface ClientPaymentSummary {
  client_id: string;
  total_amount_to_pay: number;
  amount_paid: number;
  remaining: number;
}

export type ProjectType = "software" | "marketing" | "branding" | "social_media" | "other";
export type BillingModel = "fixed" | "retainer" | "hybrid";

export type ProjectStatus =
  | "draft"
  | "active"
  | "on_hold"
  | "cancelled"
  | "completed";
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
  type: ProjectType;
  billing_model: BillingModel;
  /** Test/demo projects are excluded from every dashboard and report figure. */
  is_test: boolean;
  /** Part of the package price that is the client's ad budget (marketing / social media). */
  ad_budget: number;
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
  type?: ProjectType;
  billing_model?: BillingModel;
  is_test?: boolean;
  ad_budget?: number;
}

export interface Phase {
  id: string;
  project_id: string;
  start_date: string;
  end_date: string;
  amount: number;
  title: string;
  notes: string | null;
  created_at?: string;
}

export interface CreatePhaseInput {
  start_date: string;
  end_date: string;
  amount: number;
  title: string;
  notes?: string;
}

export interface UpdatePhaseInput {
  start_date?: string;
  end_date?: string;
  amount?: number;
  title?: string;
  notes?: string;
}

export type PaymentMethod = "cash" | "bank_transfer" | "credit_card" | "other";
export type PaymentType = "advance" | "invoice_settlement";
export interface Payment {
  id: string;
  company_id: string;
  project_id: string;
  invoice_id: string | null;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  type: PaymentType;
  notes: string | null;
  created_at: string;
}

export interface CreatePaymentInput {
  project_id: string;
  invoice_id?: string | null;
  amount: number;
  payment_date?: string;
  payment_method: PaymentMethod;
  type?: PaymentType;
  notes?: string;
}

export type ExpenseType = "direct" | "operational";
export type CostCategory =
  | "labor"
  | "materials"
  | "subcontractor"
  | "software"
  | "travel"
  | "marketing"
  | "rent"
  | "utilities"
  | "other";

/** Vendor bills keep the original categories; company expenses add payroll, ads, legal, etc. */
export type ExpenseCostCategory =
  | CostCategory
  | "salary"
  | "ad_spend"
  | "equipment"
  | "legal"
  | "bank_fees"
  | "advance";

export interface Expense {
  id: string;
  company_id: string;
  amount: number;
  expense_date: string;
  title: string;
  description: string | null;
  type: ExpenseType;
  project_id: string | null;
  phase_id: string | null;
  vendor_id: string | null;
  cost_category: ExpenseCostCategory;
  created_at: string;
}

export interface CreateExpenseInput {
  amount: number;
  expense_date?: string;
  title: string;
  description?: string;
  type: ExpenseType;
  project_id?: string | null;
  phase_id?: string | null;
  vendor_id?: string | null;
  cost_category?: ExpenseCostCategory;
}

// Invoices
export type InvoiceStatus =
  | "draft"
  | "sent"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled";

export interface Invoice {
  id: string;
  company_id: string;
  client_id: string;
  project_id: string;
  phase_id: string | null;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  currency: string;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  wht_rate: number;
  wht_amount: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: InvoiceStatus;
  notes: string | null;
  created_at: string;
  payments?: Payment[];
}

export interface CreateInvoiceInput {
  client_id: string;
  project_id: string;
  phase_id?: string | null;
  issue_date: string;
  due_date: string;
  subtotal: number;
  vat_rate?: number;
  wht_rate?: number;
  notes?: string;
}

// Vendors
export interface Vendor {
  id: string;
  company_id: string;
  name: string;
  tax_id: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  default_wht_rate: number;
  notes: string | null;
  created_at: string;
}

export interface CreateVendorInput {
  name: string;
  tax_id?: string;
  email?: string;
  phone?: string;
  address?: string;
  default_wht_rate?: number;
  notes?: string;
}

export type VendorBillStatus =
  | "pending"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled";

export interface VendorBill {
  id: string;
  company_id: string;
  vendor_id: string;
  project_id: string | null;
  bill_number: string | null;
  bill_date: string;
  due_date: string;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  wht_rate: number;
  wht_amount: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: VendorBillStatus;
  cost_category: CostCategory;
  notes: string | null;
  created_at: string;
  payments?: VendorPayment[];
}

export interface CreateVendorBillInput {
  vendor_id: string;
  project_id?: string | null;
  bill_number?: string;
  bill_date: string;
  due_date: string;
  subtotal: number;
  vat_rate?: number;
  wht_rate?: number;
  cost_category?: CostCategory;
  notes?: string;
}

export interface VendorPayment {
  id: string;
  vendor_bill_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  notes: string | null;
  created_at: string;
}

export interface CreateVendorBillPaymentInput {
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  notes?: string;
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
    /** Contract price − payments, per live project (cancelled and test projects excluded). */
    outstandingReceivables: number;
    /** Collected above the project price (price not updated, or a duplicate entry). */
    overpaidAmount: number;
    cancelledProjectsCollected: number;
    testProjectsExcluded: number;
    dateRange: { from_date: string; to_date: string } | null;
  };
  projectsByStatus: Record<string, number>;
  paymentsSummary: { total: number; count: number };
  expensesSummary: {
    total: number;
    count: number;
    byType: { direct: number; operational: number };
    adSpend: number;
    /** Recorded but kept out of profit: advances are recovered via salary, equipment is capital. */
    excludedFromProfit: { advance: number; equipment: number };
  };
  financial: FinancialStats;
}

export interface FinancialStats {
  totalRevenue: number;
  directExpenses: number;
  operationalExpenses: number;
  totalExpenses: number;
  adSpend: number;
  netRevenueAfterAdSpend: number;
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

export interface AgingBucket {
  count: number;
  amount: number;
}

export interface AgingReport {
  buckets: {
    current: AgingBucket;
    "1_30": AgingBucket;
    "31_60": AgingBucket;
    "61_90": AgingBucket;
    over_90: AgingBucket;
  };
  totalOutstanding: number;
  invoices?: Array<{
    id: string;
    invoice_number: string;
    client_name: string;
    due_date: string;
    remaining_amount: number;
    days_overdue: number;
    bucket: string;
  }>;
  bills?: Array<{
    id: string;
    bill_number: string | null;
    vendor_name: string;
    due_date: string;
    remaining_amount: number;
    days_overdue: number;
    bucket: string;
  }>;
}

export interface ProjectProfitability {
  project_id: string;
  title: string;
  recognizedRevenue: number;
  /** Revenue is invoiced subtotal when invoices exist, otherwise cash collected. */
  revenueBasis: "invoices" | "payments";
  collectedRevenue: number;
  totalCost: number;
  costBreakdown: Record<string, number>;
  grossProfit: number;
  grossMargin: number;
  adBudget: number;
  adSpend: number;
  /** Negative = overspent vs. the client's ad budget; positive = client money not yet spent. */
  adBudgetRemaining: number | null;
  budgetedCost: number | null;
  budgetVariance: number | null;
}

export const usersApi = {
  shortList: () => api.get<{ users: { id: string; name: string }[] }>("/api/users/shortList"),
};

// ---- Tasks ----
export type TaskStatus = "todo" | "in_progress" | "in_review" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface ChecklistItem {
  id: string;
  task_id: string;
  title: string;
  is_done: boolean;
  position: number;
}

export type TaskSource = "manual" | "meeting";
export type TaskAssigneeType = "team_member" | "client";

export interface Task {
  id: string;
  company_id: string;
  project_id: string;
  phase_id: string | null;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  assignee_name: string | null;
  assignee_type: TaskAssigneeType;
  client_assignee_id: string | null;
  client_assignee_name: string | null;
  source: TaskSource;
  source_id: string | null;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  position: number;
  subtasks_count: number;
  checklist_progress: { done: number; total: number };
  created_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  phase_id?: string | null;
  parent_task_id?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_type?: TaskAssigneeType;
  assignee_id?: string | null;
  client_assignee_id?: string | null;
  start_date?: string | null;
  due_date?: string | null;
}

export const tasksApi = {
  list: (projectId: string, params?: { status?: TaskStatus; assignee_id?: string; priority?: TaskPriority }) =>
    api.get<{ tasks: Task[] }>(`/api/projects/${projectId}/tasks`, { params }),
  subtasks: (taskId: string) => api.get<{ tasks: Task[] }>(`/api/tasks/${taskId}/subtasks`),
  get: (id: string) => api.get<Task>(`/api/tasks/${id}`),
  create: (projectId: string, data: CreateTaskInput) =>
    api.post<Task>(`/api/projects/${projectId}/tasks`, data),
  update: (id: string, data: Partial<CreateTaskInput>) => api.put<Task>(`/api/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/api/tasks/${id}`),
  setStatus: (id: string, status: TaskStatus) => api.post<Task>(`/api/tasks/${id}/status`, { status }),
  reorder: (projectId: string, taskIds: string[]) =>
    api.post(`/api/projects/${projectId}/tasks/reorder`, { taskIds }),
  checklist: {
    list: (taskId: string) => api.get<{ items: ChecklistItem[] }>(`/api/tasks/${taskId}/checklist`),
    add: (taskId: string, title: string) =>
      api.post<ChecklistItem>(`/api/tasks/${taskId}/checklist`, { title }),
    update: (id: string, data: Partial<Pick<ChecklistItem, "title" | "is_done" | "position">>) =>
      api.put<ChecklistItem>(`/api/checklist-items/${id}`, data),
    delete: (id: string) => api.delete(`/api/checklist-items/${id}`),
  },
  dependencies: {
    list: (taskId: string) => api.get<{ dependsOn: Task[] }>(`/api/tasks/${taskId}/dependencies`),
    add: (taskId: string, dependsOnTaskId: string) =>
      api.post(`/api/tasks/${taskId}/dependencies`, { depends_on_task_id: dependsOnTaskId }),
    remove: (taskId: string, dependsOnId: string) =>
      api.delete(`/api/tasks/${taskId}/dependencies/${dependsOnId}`),
  },
};

// ---- Client Portal (company-side management) ----
export type PortalUserStatus = "invited" | "active" | "disabled";

export interface ClientPortalUser {
  id: string;
  client_id: string;
  name: string;
  email: string;
  status: PortalUserStatus;
  last_login_at: string | null;
  created_at: string;
  /** Present while status is "invited" and the invite hasn't expired — lets staff copy/send it manually as a backup to the auto-email. */
  invite_link?: string | null;
  invite_expires_at?: string | null;
}

export const clientPortalApi = {
  list: (clientId: string) => api.get<{ portalUsers: ClientPortalUser[] }>(`/api/clients/${clientId}/portal-users`),
  invite: (clientId: string, data: { name: string; email: string }) =>
    api.post<ClientPortalUser>(`/api/clients/${clientId}/portal-users`, data),
  revoke: (clientId: string, id: string) => api.delete(`/api/clients/${clientId}/portal-users/${id}`),
};

// ---- Notifications ----
export type NotificationType =
  | "meeting_reminder"
  | "meeting_note_added"
  | "meeting_cancelled"
  | "action_item_assigned"
  | "phase_approved"
  | "task_assigned_to_client"
  | "feedback_requested"
  | "file_uploaded"
  | "file_status_changed"
  | "recurring_payment_due";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  related_type: "meeting" | "task" | "phase" | "invoice" | "file" | "recurring_revenue" | "recurring_expense" | null;
  related_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export const notificationsApi = {
  list: (params?: { is_read?: boolean; limit?: number }) =>
    api.get<{ notifications: AppNotification[]; unreadCount: number }>("/api/notifications", { params }),
  markRead: (id: string) => api.patch<AppNotification>(`/api/notifications/${id}/read`),
  markAllRead: () => api.patch("/api/notifications/read-all"),
};

// ---- Meetings ----
export type MeetingStatus = "scheduled" | "completed" | "cancelled";

export interface Meeting {
  id: string;
  project_id: string;
  title: string;
  agenda: string | null;
  scheduled_at: string;
  meeting_link: string | null;
  status: MeetingStatus;
  created_at: string;
}

export interface CreateMeetingInput {
  title: string;
  agenda?: string;
  scheduled_at: string;
  meeting_link?: string;
  /** Optional — when omitted the server invites the project client's portal users automatically. */
  attendee_ids?: { team_member_ids?: string[]; client_portal_user_ids?: string[] };
}

export interface UpdateMeetingInput {
  title?: string;
  agenda?: string;
  scheduled_at?: string;
  meeting_link?: string;
  status?: MeetingStatus;
}

export interface ActionItemInput {
  title: string;
  assignee_type: TaskAssigneeType;
  assignee_id: string;
  due_date?: string;
}

export interface MeetingNoteRead {
  portal_user_id: string;
  portal_user_name: string;
  read_at: string;
}

export interface MeetingNote {
  id: string;
  meeting_id: string;
  content: string;
  word_file_url: string | null;
  created_at: string;
  reads: MeetingNoteRead[];
}

export const meetingsApi = {
  list: (projectId: string, params?: { status?: MeetingStatus }) =>
    api.get<{ meetings: Meeting[] }>(`/api/projects/${projectId}/meetings`, { params }),
  create: (projectId: string, data: CreateMeetingInput) =>
    api.post<Meeting>(`/api/projects/${projectId}/meetings`, data),
  update: (id: string, data: UpdateMeetingInput) => api.patch<Meeting>(`/api/meetings/${id}`, data),
  notes: {
    list: (meetingId: string) => api.get<{ notes: MeetingNote[] }>(`/api/meetings/${meetingId}/notes`),
    add: (meetingId: string, data: { content: string; action_items?: ActionItemInput[] }) =>
      api.post<MeetingNote>(`/api/meetings/${meetingId}/notes`, data),
    exportUrl: (meetingId: string) => `${API_BASE}api/meetings/${meetingId}/notes/export`,
  },
};

// ---- Project Links ----
export type ProjectLinkType = "staging" | "live" | "dashboard" | "other";

export interface ProjectLink {
  id: string;
  project_id: string;
  label: string;
  url: string;
  type: ProjectLinkType;
  created_at: string;
}

export interface CreateProjectLinkInput {
  label: string;
  url: string;
  type?: ProjectLinkType;
}

export const projectLinksApi = {
  list: (projectId: string) => api.get<{ links: ProjectLink[] }>(`/api/projects/${projectId}/links`),
  create: (projectId: string, data: CreateProjectLinkInput) =>
    api.post<ProjectLink>(`/api/projects/${projectId}/links`, data),
  delete: (id: string) => api.delete(`/api/project-links/${id}`),
};

// ---- Credentials ----
export interface Credential {
  id: string;
  project_id: string;
  label: string;
  username: string;
  panel_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface CreateCredentialInput {
  label: string;
  username: string;
  password: string;
  panel_url?: string;
  notes?: string;
}

export interface CredentialAccessLog {
  accessed_by_type: "team_member" | "client_portal_user";
  accessed_by_name: string;
  accessed_at: string;
}

export const credentialsApi = {
  list: (projectId: string) => api.get<{ credentials: Credential[] }>(`/api/projects/${projectId}/credentials`),
  create: (projectId: string, data: CreateCredentialInput) =>
    api.post<Credential>(`/api/projects/${projectId}/credentials`, data),
  reveal: (id: string) => api.post<{ password: string }>(`/api/credentials/${id}/reveal`),
  accessLog: (id: string) => api.get<{ logs: CredentialAccessLog[] }>(`/api/credentials/${id}/access-log`),
};

// ---- Micro-feedback ----
export type FeedbackRelatedType = "meeting" | "phase";

export interface FeedbackEntry {
  id: string;
  related_type: FeedbackRelatedType;
  related_id: string;
  rating: number;
  submitted_by_name: string;
  created_at: string;
}

export const feedbackApi = {
  list: (projectId: string) =>
    api.get<{ feedback: FeedbackEntry[]; averageRating: number }>(`/api/projects/${projectId}/feedback`),
};

// ---- Project Files ----
// NOTE: the real backend stores a URL + metadata only — there is no binary upload endpoint,
// so "uploading" a file here means pasting a link to where it already lives (Drive, S3...).
export type FileCategory = "deliverable" | "client_upload";
export type FileStatus = "pending_review" | "approved" | "needs_changes" | "rejected";
export type FileUploaderType = "team_member" | "client";

export interface ProjectFile {
  id: string;
  project_id: string;
  uploaded_by_type: FileUploaderType;
  uploaded_by_id: string;
  category: FileCategory;
  file_name: string;
  description: string | null;
  file_url: string;
  status: FileStatus | null; // null for category="client_upload" (no review workflow)
  created_at: string;
  updated_at?: string;
}

export interface FileComment {
  id: string;
  file_id: string;
  author_type: FileUploaderType;
  author_id: string;
  comment: string;
  created_at: string;
}

export interface CreateProjectFileInput {
  file_name: string;
  file_url: string;
  description?: string;
}

export const filesApi = {
  list: (projectId: string, params?: { category?: FileCategory; status?: FileStatus }) =>
    api.get<{ files: ProjectFile[] }>(`/api/projects/${projectId}/files`, { params }),
  upload: (projectId: string, data: CreateProjectFileInput) =>
    api.post<ProjectFile>(`/api/projects/${projectId}/files`, data),
  comments: {
    list: (fileId: string) => api.get<{ comments: FileComment[] }>(`/api/files/${fileId}/comments`),
    add: (fileId: string, content: string) =>
      api.post<FileComment>(`/api/files/${fileId}/comments`, { content }),
  },
};

// ---- Recurring Revenue (client hosting/subscriptions) ----
export type RecurringRevenueType = "hosting" | "maintenance" | "other";
export type BillingCycle = "monthly" | "yearly";
export type RecurringRevenueStatus = "active" | "cancelled" | "overdue";

export interface RecurringRevenue {
  id: string;
  client_id: string;
  client_name: string;
  project_id: string | null;
  project_title: string | null;
  type: RecurringRevenueType;
  amount: number;
  currency?: string;
  billing_cycle: BillingCycle;
  next_renewal_date: string;
  last_paid_date: string | null;
  status: RecurringRevenueStatus;
  notes: string | null;
  created_at: string;
}

export interface CreateRecurringRevenueInput {
  client_id: string;
  project_id?: string | null;
  type: RecurringRevenueType;
  amount: number;
  billing_cycle: BillingCycle;
  next_renewal_date: string;
  notes?: string;
}

export interface HostingSummaryItem {
  id: string;
  type: string;
  client_name: string | null;
  amount: number;
  next_renewal_date: string;
  status: RecurringRevenueStatus;
}

export interface HostingSummary {
  upcomingTotal: number;
  upcomingCount: number;
  overdueTotal: number;
  overdueCount: number;
  items: HostingSummaryItem[];
}

export const recurringRevenueApi = {
  list: (params?: { status?: RecurringRevenueStatus; client_id?: string; project_id?: string; page?: number; limit?: number }) =>
    api.get<{ recurringRevenue: RecurringRevenue[]; pagination?: Pagination }>("/api/recurring-revenue", { params }),
  create: (data: CreateRecurringRevenueInput) => api.post<RecurringRevenue>("/api/recurring-revenue", data),
  update: (id: string, data: Partial<CreateRecurringRevenueInput> & { status?: RecurringRevenueStatus }) =>
    api.patch<RecurringRevenue>(`/api/recurring-revenue/${id}`, data),
  delete: (id: string) => api.delete(`/api/recurring-revenue/${id}`),
  upcoming: (days?: number) =>
    api.get<{ recurringRevenue: RecurringRevenue[] }>("/api/recurring-revenue/upcoming", { params: { days } }),
  overdue: () => api.get<{ recurringRevenue: RecurringRevenue[] }>("/api/recurring-revenue/overdue"),
  markPaid: (id: string) => api.post<RecurringRevenue>(`/api/recurring-revenue/${id}/mark-paid`),
};

// ---- Recurring Expenses (server/AI subscriptions the company pays) ----
export type RecurringExpenseType = "hosting_cost" | "ai_subscription" | "tool_subscription" | "other";
export type RecurringExpenseStatus = "active" | "cancelled";

export interface RecurringExpense {
  id: string;
  name: string;
  linked_project_id: string | null;
  project_title: string | null;
  type: RecurringExpenseType;
  amount: number;
  currency?: string;
  billing_cycle: BillingCycle;
  next_due_date: string;
  last_paid_date: string | null;
  status: RecurringExpenseStatus;
  /** When true the daily job records the expense on the due date and moves the date forward. */
  auto_charge: boolean;
  notes: string | null;
  created_at: string;
}

export interface CreateRecurringExpenseInput {
  name: string;
  linked_project_id?: string | null;
  type: RecurringExpenseType;
  amount: number;
  billing_cycle: BillingCycle;
  next_due_date: string;
  auto_charge?: boolean;
  notes?: string;
}

export const recurringExpensesApi = {
  list: (params?: { status?: RecurringExpenseStatus; linked_project_id?: string; page?: number; limit?: number }) =>
    api.get<{ recurringExpenses: RecurringExpense[]; pagination?: Pagination }>("/api/recurring-expenses", { params }),
  create: (data: CreateRecurringExpenseInput) => api.post<RecurringExpense>("/api/recurring-expenses", data),
  update: (id: string, data: Partial<CreateRecurringExpenseInput> & { status?: RecurringExpenseStatus }) =>
    api.patch<RecurringExpense>(`/api/recurring-expenses/${id}`, data),
  delete: (id: string) => api.delete(`/api/recurring-expenses/${id}`),
  upcoming: (days?: number) =>
    api.get<{ recurringExpenses: RecurringExpense[] }>("/api/recurring-expenses/upcoming", { params: { days } }),
  overdue: () => api.get<{ recurringExpenses: RecurringExpense[] }>("/api/recurring-expenses/overdue"),
  markPaid: (id: string) => api.post<RecurringExpense>(`/api/recurring-expenses/${id}/mark-paid`),
};

export const financeSummaryApi = {
  hosting: () => api.get<HostingSummary>("/api/finance/hosting-summary"),
};

// ---- Investments ----
export type InvestmentStatus = "active" | "closed";
export type InvestmentReturnCycle = "one_time" | "monthly" | "yearly";

export interface Investment {
  id: string;
  name: string;
  amount_invested: number;
  currency?: string;
  investment_date: string;
  expected_return: number | null;
  return_cycle: InvestmentReturnCycle | null;
  status: InvestmentStatus;
  notes: string | null;
  created_at: string;
}

export interface InvestmentReturn {
  id: string;
  investment_id: string;
  amount: number;
  received_date: string;
  created_at: string;
}

export interface InvestmentSummaryRow {
  investment_id: string;
  name: string;
  amountInvested: number;
  totalReturns: number;
  returnPercent: number;
}

export interface InvestmentsSummary {
  totalInvested: number;
  totalReturns: number;
  overallReturnPercent: number;
  investments: InvestmentSummaryRow[];
}

export interface CreateInvestmentInput {
  name: string;
  amount_invested: number;
  investment_date: string;
  expected_return?: number;
  return_cycle?: InvestmentReturnCycle;
  status?: InvestmentStatus;
  notes?: string;
}

export const investmentsApi = {
  list: () => api.get<{ investments: Investment[] }>("/api/investments"),
  get: (id: string) => api.get<Investment>(`/api/investments/${id}`),
  summary: () => api.get<InvestmentsSummary>("/api/investments/summary"),
  create: (data: CreateInvestmentInput) => api.post<Investment>("/api/investments", data),
  update: (id: string, data: Partial<CreateInvestmentInput> & { status?: InvestmentStatus }) =>
    api.patch<Investment>(`/api/investments/${id}`, data),
  delete: (id: string) => api.delete(`/api/investments/${id}`),
  listReturns: (id: string) => api.get<{ returns: InvestmentReturn[] }>(`/api/investments/${id}/returns`),
  addReturn: (id: string, data: { amount: number; received_date: string }) =>
    api.post<InvestmentReturn>(`/api/investments/${id}/returns`, data),
};

// ---- Project monthly reports (marketing / social media) ----
export interface ProjectReport {
  id: string;
  project_id: string;
  /** First day of the month, "YYYY-MM-DD". */
  period_month: string;
  ad_spend: number;
  reach: number | null;
  leads: number | null;
  followers_gained: number | null;
  posts_published: number | null;
  summary: string | null;
}

export interface ProjectReportInput {
  /** "YYYY-MM" (or "YYYY-MM-DD"); the server stores the first of the month. */
  period_month?: string;
  ad_spend?: number;
  reach?: number | null;
  leads?: number | null;
  followers_gained?: number | null;
  posts_published?: number | null;
  summary?: string | null;
}

export const projectReportsApi = {
  list: (projectId: string) => api.get<{ reports: ProjectReport[] }>(`/api/projects/${projectId}/reports`),
  create: (projectId: string, data: ProjectReportInput) =>
    api.post<ProjectReport>(`/api/projects/${projectId}/reports`, data),
  update: (id: string, data: ProjectReportInput) => api.put<ProjectReport>(`/api/project-reports/${id}`, data),
  delete: (id: string) => api.delete(`/api/project-reports/${id}`),
};

// ---- Accounts (owner / admin only) ----
export type AccountStatus = "active" | "inactive" | "blocked";

export interface Account {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  must_change_password: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface CreateAccountInput {
  name: string;
  email: string;
  role: UserRole;
  /** Optional. Leave out and the server generates a strong temporary password. */
  password?: string;
}

export interface UpdateAccountInput {
  name?: string;
  role?: UserRole;
}

export const accountsApi = {
  list: () => api.get<{ accounts: Account[]; assignableRoles: UserRole[] }>("/api/accounts"),
  create: (data: CreateAccountInput) =>
    api.post<Account & { temporary_password: string }>("/api/accounts", data),
  update: (id: string, data: UpdateAccountInput) => api.put<Account>(`/api/accounts/${id}`, data),
  setStatus: (id: string, status: AccountStatus) => api.patch<Account>(`/api/accounts/${id}/status`, { status }),
  resetPassword: (id: string) =>
    api.post<{ id: string; temporary_password: string }>(`/api/accounts/${id}/reset-password`),
};

// ---- Audit log (owner / admin only, read-only) ----
export interface AuditLogEntry {
  id: string;
  occurred_at: string;
  actor_type: "user" | "client_portal_user" | "system" | "anonymous";
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  outcome: "success" | "failure";
  status_code: number | null;
  method: string | null;
  path: string | null;
  ip: string | null;
  summary: string | null;
}

export interface AuditLogDetail extends AuditLogEntry {
  user_agent: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
}

export interface AuditLogFilters {
  from_date?: string;
  to_date?: string;
  actor_id?: string;
  actor_type?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  outcome?: "success" | "failure";
  q?: string;
  page?: number;
  limit?: number;
}

export const auditLogsApi = {
  list: (params: AuditLogFilters) =>
    api.get<{ logs: AuditLogEntry[]; pagination: Pagination }>("/api/audit-logs", { params }),
  get: (id: string) => api.get<AuditLogDetail>(`/api/audit-logs/${id}`),
};

// ---- Monthly financial report (cash basis) ----
export interface MonthlyFinance {
  /** "2026-03", or the year for the totals row. */
  month: string;
  revenue: number;
  paymentsCount: number;
  directExpenses: number;
  operationalExpenses: number;
  totalExpenses: number;
  adSpend: number;
  grossProfit: number;
  netProfit: number;
  /** null when the month had no revenue (a percentage would be meaningless). */
  marginPercent: number | null;
  /** Recorded but kept out of profit: employee advances (recovered via salary) and equipment purchases. */
  excludedFromProfit: { advance: number; equipment: number };
}

export interface YearReportRows {
  payments: { date: string; project_title: string | null; amount: number; method: string | null; notes: string | null }[];
  expenses: {
    date: string;
    title: string;
    type: string;
    cost_category: string;
    project_title: string | null;
    amount: number;
    description: string | null;
    in_profit: boolean;
  }[];
}

export interface YearReport {
  year: number;
  basis: "cash";
  months: MonthlyFinance[];
  totals: MonthlyFinance;
  /** Only when requested with rows=1 (used by the Excel export). */
  rows?: YearReportRows;
}

export interface MonthDetail {
  month: string;
  summary: MonthlyFinance;
  revenueByProject: { project_id: string; title: string | null; amount: number; count: number }[];
  expensesByCategory: { category: string; amount: number; count: number }[];
  topExpenses: {
    id: string;
    title: string;
    expense_date: string;
    amount: number;
    type: string;
    cost_category: string;
    project_title: string | null;
  }[];
}
