# ملف تنفيذ الفرونت إند — المرحلة 1

هذا الملف موجَّه لتنفيذ التعديلات على **هذا الريبو تحديدًا** (Next.js + React Query + Tailwind). يفترض إن الباك إند نفّذ الـ endpoints في [`PMS-PHASE1-BACKEND-SPEC.md`](./PMS-PHASE1-BACKEND-SPEC.md). كل تعديل هنا متسق مع الأنماط الموجودة فعليًا في الكود (نفس شكل `lib/api.ts`, `hooks/use-payments.ts`, `components/*FormModal.tsx`).

---

## 1. `lib/api.ts` — التعديلات المطلوبة

### 1.1 تحديث الأنواع الموجودة

```ts
// Expense — إضافة حقول اختيارية
export type CostCategory =
  | "labor" | "materials" | "subcontractor" | "software"
  | "travel" | "marketing" | "rent" | "utilities" | "other";

export interface Expense {
  id: string;
  company_id: string;
  amount: number;
  expense_date: string;
  title: string;
  description: string | null;
  type: ExpenseType;
  project_id: string | null;      // NEW
  phase_id: string | null;        // NEW
  vendor_id: string | null;       // NEW
  cost_category: CostCategory;    // NEW
  created_at: string;
}

export interface CreateExpenseInput {
  amount: number;
  expense_date?: string;
  title: string;
  description?: string;
  type: ExpenseType;
  project_id?: string | null;     // NEW
  phase_id?: string | null;       // NEW
  vendor_id?: string | null;      // NEW
  cost_category?: CostCategory;   // NEW
}

// Payment — إضافة حقول اختيارية
export type PaymentType = "advance" | "invoice_settlement";

export interface Payment {
  id: string;
  company_id: string;
  project_id: string;
  invoice_id: string | null;      // NEW
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  type: PaymentType;               // NEW
  notes: string | null;
  created_at: string;
}

export interface CreatePaymentInput {
  project_id: string;
  invoice_id?: string | null;     // NEW
  amount: number;
  payment_date?: string;
  payment_method: PaymentMethod;
  type?: PaymentType;              // NEW
  notes?: string;
}
```

### 1.2 أنواع جديدة (Invoices)

```ts
export type InvoiceStatus =
  | "draft" | "sent" | "partially_paid" | "paid" | "overdue" | "cancelled";

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

export const invoicesApi = {
  list: (params?: {
    page?: number; limit?: number; project_id?: string; client_id?: string;
    status?: InvoiceStatus; from_date?: string; to_date?: string;
  }) => api.get<{ invoices: Invoice[]; pagination: Pagination }>("/api/invoices", { params }),
  get: (id: string) => api.get<Invoice>(`/api/invoices/${id}`),
  create: (data: CreateInvoiceInput) => api.post<Invoice>("/api/invoices", data),
  update: (id: string, data: Partial<CreateInvoiceInput>) => api.put<Invoice>(`/api/invoices/${id}`, data),
  send: (id: string) => api.post<Invoice>(`/api/invoices/${id}/send`),
  cancel: (id: string, reason?: string) => api.post<Invoice>(`/api/invoices/${id}/cancel`, { reason }),
};
```

### 1.3 أنواع جديدة (Vendors & Vendor Bills)

```ts
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

export const vendorsApi = {
  list: (params?: { page?: number; limit?: number; q?: string }) =>
    api.get<{ vendors: Vendor[]; pagination: Pagination }>("/api/vendors", { params }),
  shortList: () => api.get<{ vendors: { id: string; name: string }[] }>("/api/vendors/shortList"),
  get: (id: string) => api.get<Vendor>(`/api/vendors/${id}`),
  create: (data: CreateVendorInput) => api.post<Vendor>("/api/vendors", data),
  update: (id: string, data: Partial<CreateVendorInput>) => api.put<Vendor>(`/api/vendors/${id}`, data),
  delete: (id: string) => api.delete(`/api/vendors/${id}`),
};

export type VendorBillStatus = "pending" | "partially_paid" | "paid" | "overdue" | "cancelled";

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

export interface CreateVendorBillPaymentInput {
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  notes?: string;
}

export const vendorBillsApi = {
  list: (params?: {
    page?: number; limit?: number; vendor_id?: string; project_id?: string; status?: VendorBillStatus;
  }) => api.get<{ vendorBills: VendorBill[]; pagination: Pagination }>("/api/vendor-bills", { params }),
  get: (id: string) => api.get<VendorBill>(`/api/vendor-bills/${id}`),
  create: (data: CreateVendorBillInput) => api.post<VendorBill>("/api/vendor-bills", data),
  update: (id: string, data: Partial<CreateVendorBillInput>) => api.put<VendorBill>(`/api/vendor-bills/${id}`, data),
  delete: (id: string) => api.delete(`/api/vendor-bills/${id}`),
  addPayment: (id: string, data: CreateVendorBillPaymentInput) =>
    api.post<VendorBill>(`/api/vendor-bills/${id}/payments`, data),
};
```

### 1.4 تحديث `statisticsApi`

```ts
export interface AgingBucket { count: number; amount: number }
export interface AgingReport {
  buckets: {
    current: AgingBucket; "1_30": AgingBucket; "31_60": AgingBucket;
    "61_90": AgingBucket; over_90: AgingBucket;
  };
  totalOutstanding: number;
  invoices?: Array<{ id: string; invoice_number: string; client_name: string; due_date: string; remaining_amount: number; days_overdue: number; bucket: string }>;
  bills?: Array<{ id: string; bill_number: string | null; vendor_name: string; due_date: string; remaining_amount: number; days_overdue: number; bucket: string }>;
}

export interface ProjectProfitability {
  project_id: string;
  title: string;
  recognizedRevenue: number;
  collectedRevenue: number;
  totalCost: number;
  costBreakdown: Record<string, number>;
  grossProfit: number;
  grossMargin: number;
  budgetedCost: number | null;
  budgetVariance: number | null;
}

export const statisticsApi = {
  // ...existing methods...
  financial: (params?: { from_date?: string; to_date?: string; basis?: "accrual" | "cash" }) =>
    api.get<FinancialStats & { basis: "accrual" | "cash" }>("/api/statistics/financial", { params }),
  arAging: (params?: { client_id?: string; project_id?: string }) =>
    api.get<AgingReport>("/api/statistics/ar-aging", { params }),
  apAging: (params?: { vendor_id?: string; project_id?: string }) =>
    api.get<AgingReport>("/api/statistics/ap-aging", { params }),
  projectProfitability: (params?: { project_id?: string }) =>
    api.get<ProjectProfitability | { projects: ProjectProfitability[]; pagination: Pagination }>(
      "/api/statistics/project-profitability", { params },
    ),
};
```

---

## 2. Hooks جديدة (نفس نمط `hooks/use-payments.ts`)

### 2.1 `hooks/use-invoices.ts`

```ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesApi, type CreateInvoiceInput, type InvoiceStatus } from "@/lib/api";

export function useInvoices(params?: {
  page?: number; limit?: number; project_id?: string; client_id?: string;
  status?: InvoiceStatus; from_date?: string; to_date?: string;
}) {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: () => invoicesApi.list(params).then((r) => r.data),
  });
}

export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: () => invoicesApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvoiceInput) => invoicesApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateInvoice(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateInvoiceInput>) => invoicesApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoices", id] });
    },
  });
}

export function useSendInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.send(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
}

export function useCancelInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      invoicesApi.cancel(id, reason).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
}
```

### 2.2 `hooks/use-vendors.ts` و `hooks/use-vendor-bills.ts`

نفس البنية بالضبط (list/get/create/update/delete) + hook إضافي `useAddVendorBillPayment` بنفس منطق `useCreatePayment` الحالي، مع invalidate لـ `["vendor-bills"]` و`["vendor-bills", id]`.

### 2.3 `hooks/use-statistics.ts` — إضافات

```ts
export function useArAging(params?: { client_id?: string; project_id?: string }) {
  return useQuery({
    queryKey: ["statistics", "ar-aging", params],
    queryFn: () => statisticsApi.arAging(params).then((r) => r.data),
  });
}

export function useApAging(params?: { vendor_id?: string; project_id?: string }) {
  return useQuery({
    queryKey: ["statistics", "ap-aging", params],
    queryFn: () => statisticsApi.apAging(params).then((r) => r.data),
  });
}

export function useProjectProfitability(projectId?: string) {
  return useQuery({
    queryKey: ["statistics", "project-profitability", projectId],
    queryFn: () => statisticsApi.projectProfitability(projectId ? { project_id: projectId } : undefined).then((r) => r.data),
  });
}
```

---

## 3. تعديلات على شاشات موجودة

### 3.1 `app/dashboard/expenses/ExpenseFormModal.tsx` + `components/expenses/ExpenseForm.tsx`

إضافة حقلين:
- **Project** (dropdown اختياري، "General / No project" كخيار أول) — استخدم `useProjects` الموجود بالفعل (`projectsApi.shortList`) مع `CustomSelect` الموجود في `components/ui/CustomSelect.tsx`.
- **Cost Category** (dropdown من enum `CostCategory`) — نفس نمط `Select`/`CustomSelect` المستخدم لـ `type` (direct/operational) حاليًا.

لو حابب تُفعّل اختيار Phase كمان لازم يكون **مشروط بوجود project_id** (dropdown ثاني يظهر بس بعد اختيار مشروع، بنفس فكرة `useProjectPhases` الموجود في hooks/use-phases.ts).

### 3.2 `app/dashboard/payments/PaymentFormModal.tsx` + `components/payments/PaymentForm.tsx`

إضافة:
- **Invoice** (dropdown اختياري) — يظهر بعد اختيار Project، ويعرض فقط فواتير المشروع دي اللي حالتها مش `paid`/`cancelled` (استخدم `useInvoices({ project_id, status: ... })` أو فلترة على الفرونت). لو محدّش فاتورة → `type` يبقى `advance` تلقائيًا.
- عرض `remaining_amount` بجانب كل فاتورة في الـ dropdown عشان المستخدم يعرف المبلغ المطلوب.
- **Validation على الفرونت**: منع إدخال `amount` أكبر من `remaining_amount` الخاص بالفاتورة المختارة (رسالة تحذير قبل الإرسال، الـ backend برضه بيرفضها لو اتخطت).

### 3.3 `components/layout/Sidebar.tsx`

```ts
const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/invoices", label: "Invoices", icon: FileText },      // NEW
  { href: "/dashboard/vendors", label: "Vendors", icon: Truck },           // NEW
  { href: "/dashboard/finance", label: "Finance", icon: Wallet },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/expenses", label: "Expenses", icon: Receipt },
];
```
(أيقونات `FileText`, `Truck` من `lucide-react` المستخدمة بالفعل في المشروع).

### 3.4 `app/dashboard/finance/page.tsx`

إضافة كارتين جدد في أول صف الكروت (بعد Revenue/Expenses/Gross/Net):
- **Outstanding Receivables** (`useArAging().data.totalOutstanding`) مع رابط لصفحة AR Aging التفصيلية.
- **Outstanding Payables** (`useApAging().data.totalOutstanding`) مع رابط لصفحة AP Aging.

وإضافة toggle بسيط "Accrual / Cash" فوق الكروت يبعت `basis` للـ `useFinancialStats` (تعديل الـ hook ليقبل `basis` في الـ params زي باقي الـ params).

### 3.5 `app/dashboard/projects/[id]/page.tsx`

إضافة تبويب/قسم جديد **"Invoices"** بجانب "Payments" و"Phases" الموجودين، يعرض:
- قائمة فواتير المشروع (`useInvoices({ project_id })`) بحالتها ومبالغها.
- زرار "Create Invoice" (يفتح modal شبيه بـ `PhaseFormModal.tsx` لكن بحقول الفاتورة) — يقترح ملء `subtotal` تلقائيًا من `amount` الخاص بالـ Phase المختارة.
- كارت صغير "Project Profitability" (`useProjectProfitability(projectId)`) يعرض Revenue/Cost/Gross Margin بجانب الملخص المالي الموجود بالفعل (`ClientPaymentSummary`).

---

## 4. شاشات جديدة بالكامل

### 4.1 `app/dashboard/invoices/page.tsx`

نفس بنية `app/dashboard/payments/page.tsx` الحالية (جدول + فلاتر + Pagination) لكن لـ Invoices:
- أعمدة الجدول: Invoice #, Client, Project, Issue Date, Due Date, Total, Remaining, Status (badge ملوّن حسب الحالة).
- فلاتر: Client (CustomSelect من `clientsApi.shortList`), Project, Status, Date range.
- زرار "New Invoice" يفتح `InvoiceFormModal.tsx` (نفس بنية `PaymentFormModal.tsx`).
- Row actions: "Send" (لو draft), "Cancel" (لو مش paid/cancelled), "View" (تفاصيل + الدفعات المرتبطة).

### 4.2 `app/dashboard/invoices/[id]/page.tsx` (اختياري لكن موصى به)

صفحة تفاصيل فاتورة: بيانات الفاتورة كاملة + جدول الدفعات المرتبطة بيها + زرار "Record Payment" (يفتح `PaymentFormModal` مع `invoice_id` مُمرَّر مسبقًا).

### 4.3 `app/dashboard/invoices/ar-aging/page.tsx` (أو تبويب داخل `/dashboard/finance`)

عرض بصري لتقرير AR Aging: 5 كروت (Current, 1-30, 31-60, 61-90, 90+) بألوان تدرّجية (أخضر → أحمر) + جدول تفصيلي بالفواتير المتأخرة.

### 4.4 `app/dashboard/vendors/page.tsx` + `VendorFormModal.tsx`

نفس بنية `app/dashboard/clients/page.tsx` بالضبط (نفس الأعمدة تقريبًا: Name, Contact, Tax ID) + نفس نمط `ClientFormModal.tsx`.

### 4.5 `app/dashboard/vendors/[id]/page.tsx`

نفس بنية `app/dashboard/clients/[id]/page.tsx` (تفاصيل + Payment Summary) لكن يعرض **Vendor Bills** بدل Projects، مع Payment Summary بمنطق "Total Owed / Paid / Remaining" بدل "To Pay / Paid / Remaining".

---

## 5. ترتيب تنفيذ الفرونت إند المقترح

```
[ ] 1. تحديث lib/api.ts بالكامل (كل الأنواع والـ API objects أعلاه) — لا يكسر شيء لأن كله إضافات
[ ] 2. hooks/use-invoices.ts, use-vendors.ts, use-vendor-bills.ts + إضافات use-statistics.ts
[ ] 3. تعديل ExpenseFormModal (project + cost_category) — أول قيمة حقيقية ملموسة (Job Costing يبدأ يشتغل)
[ ] 4. تعديل PaymentFormModal (invoice_id اختياري)
[ ] 5. شاشات Vendors (الأبسط، نفس نمط Clients الموجود بالضبط)
[ ] 6. شاشات Invoices (list + form + detail)
[ ] 7. تبويب Invoices داخل صفحة تفاصيل المشروع + كارت Project Profitability
[ ] 8. تحديث Finance page (كروت AR/AP + toggle accrual/cash)
[ ] 9. صفحة/قسم AR Aging + AP Aging بصريًا
[ ] 10. Sidebar nav (خطوة أخيرة بسيطة)
```

> **نصيحة تنفيذية**: نفّذ الخطوات 1-4 الأول وشغّلها فعليًا مقابل الباك إند (حتى لو staging)، لأنها بتفتح أكبر قيمة (ربط المصروفات بالمشاريع + الدفعات بالفواتير) بأقل مجهود UI، والباقي (شاشات كاملة جديدة) ممكن يتوزع أو يتأجل شوية بدون ما يعطّل بقية الفريق.
