# تصميم الـ Data Model — المرحلة 1 (الأساسيات المحاسبية)

هذا التقرير تفصيل كامل للـ data model الخاص بالمرحلة 1 من [`PMS-DEVELOPMENT-ROADMAP.md`](./PMS-DEVELOPMENT-ROADMAP.md):
1. ربط المصروفات بالمشاريع (Job Costing أساسي).
2. فصل الفاتورة (Invoice) عن التحصيل (Payment).
3. الضرائب المصرية (VAT + WHT) على مستوى الفاتورة/فاتورة المورد.
4. الموردين والتزامات الشراء (Vendor / VendorBill / VendorPayment).
5. تقرير أعمار الديون (AR Aging).

التصميم متسق مع القواعد الموجودة فعليًا في الباك إند الحالي (uuid PKs، snake_case، `company_id` على كل جدول، `created_at`/`created_by`، شكل الـ pagination `{page, limit, total}`) بحيث يندمج بسهولة بدل ما يبقى نظام مواز.

---

## 1. مبدأ التصميم العام

- **لا حذف فعلي (Soft delete) للسجلات المالية**: أي جدول مالي (Invoice, Payment, VendorBill, VendorPayment) لا يُحذف نهائيًا؛ بدلاً من ذلك حالة `cancelled` أو `voided_at`. الحذف الفعلي مسموح فقط في `Expense` القديم زي ما هو حاليًا (أو يُستبدل هو كمان بـ soft delete لاحقًا — اختياري).
- **كل مبلغ مالي = `numeric(14,2)`** (مش float) لتفادي أخطاء التقريب.
- **كل جدول جديد فيه `company_id`** لعزل بيانات كل شركة (Multi-tenant) بنفس نمط الجداول الحالية.
- **العملة**: نفترض عملة واحدة (EGP) للمرحلة 1 (Multi-currency في المرحلة 3)، لكن نضيف حقل `currency` بقيمة افتراضية `"EGP"` من الأول عشان مانرجعش نعدّل الجداول تاني.
- **الترقيم التسلسلي للفواتير** (`invoice_number`) مطلوب قانونيًا في مصر — يُولَّد تلقائيًا بصيغة قابلة للتخصيص (مثلاً `INV-2026-0001`).

---

## 2. تعديل الجداول الموجودة

### 2.1 `Expense` (تعديل)

```sql
ALTER TABLE expenses
  ADD COLUMN project_id     uuid NULL REFERENCES projects(id) ON DELETE SET NULL,
  ADD COLUMN phase_id       uuid NULL REFERENCES phases(id) ON DELETE SET NULL,
  ADD COLUMN vendor_id      uuid NULL REFERENCES vendors(id) ON DELETE SET NULL,
  ADD COLUMN cost_category  varchar(30) NOT NULL DEFAULT 'other';
  -- cost_category enum: 'labor' | 'materials' | 'subcontractor' | 'software' | 'travel' | 'marketing' | 'rent' | 'utilities' | 'other'
```

| الحقل | النوع | ملاحظات |
|---|---|---|
| `project_id` | uuid, nullable | لو `null` → مصروف عام على مستوى الشركة (كما هو الوضع الحالي بالكامل). لو موجود → يُحتسب في تكلفة المشروع |
| `phase_id` | uuid, nullable | تفصيل اختياري على مستوى المرحلة |
| `vendor_id` | uuid, nullable | لو المصروف مرتبط بمورد مسجَّل (بدل حقل نصي حر) |
| `cost_category` | enum/text | تصنيف التكلفة لتحليل أعمق لاحقًا |

> **التوافق الخلفي**: كل الحقول الجديدة nullable بقيمة افتراضية، فالمصروفات الحالية (بدون project_id) تفضل تشتغل عادي كـ "مصروفات تشغيلية عامة" — مفيش Breaking Change.

### 2.2 `Payment` (تعديل)

```sql
ALTER TABLE payments
  ADD COLUMN invoice_id  uuid NULL REFERENCES invoices(id) ON DELETE SET NULL,
  ADD COLUMN type        varchar(20) NOT NULL DEFAULT 'invoice_settlement';
  -- type enum: 'advance' | 'invoice_settlement'
```

| الحقل | النوع | ملاحظات |
|---|---|---|
| `invoice_id` | uuid, nullable | الفاتورة اللي الدفعة دي بتسدد فيها (كليًا أو جزئيًا). لو `null` والـ `type = 'advance'` → دفعة مقدمة لسه مش متربطة بفاتورة (Unearned Revenue) |
| `type` | enum | `advance` = دفعة مقدمة غير مخصصة لفاتورة بعد، `invoice_settlement` = سداد مقابل فاتورة محددة |

> **ملاحظة مهمة**: الـ `Payment` بيفضل موجود بالضبط زي ما هو (amount, payment_date, payment_method) — بس دلوقتي بقى "تحصيل" بيتربط اختياريًا بـ Invoice بدل ما يكون هو نفسه مصدر حساب الإيراد.

---

## 3. الجداول الجديدة

### 3.1 `invoices`

```sql
CREATE TABLE invoices (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid NOT NULL REFERENCES companies(id),
  client_id         uuid NOT NULL REFERENCES clients(id),
  project_id        uuid NOT NULL REFERENCES projects(id),
  phase_id          uuid NULL REFERENCES phases(id),

  invoice_number    varchar(30) NOT NULL,      -- e.g. INV-2026-0001, unique per company
  issue_date        date NOT NULL,
  due_date          date NOT NULL,

  currency          varchar(3) NOT NULL DEFAULT 'EGP',
  subtotal          numeric(14,2) NOT NULL,
  vat_rate          numeric(5,2)  NOT NULL DEFAULT 14.00,
  vat_amount        numeric(14,2) NOT NULL DEFAULT 0,
  wht_rate          numeric(5,2)  NOT NULL DEFAULT 0,
  wht_amount        numeric(14,2) NOT NULL DEFAULT 0,
  total_amount      numeric(14,2) NOT NULL,     -- subtotal + vat_amount - wht_amount
  paid_amount       numeric(14,2) NOT NULL DEFAULT 0,   -- computed/denormalized من الـ Payments المرتبطة
  remaining_amount  numeric(14,2) NOT NULL,             -- total_amount - paid_amount

  status            varchar(20) NOT NULL DEFAULT 'draft',
  -- status enum: 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled'

  retainage_percent numeric(5,2) NULL,          -- نسبة محتجزة اختيارية (مرحلة لاحقة فعليًا لكن الحقل من الأول)
  eta_uuid          varchar(100) NULL,          -- مرجع الفوترة الإلكترونية (مرحلة 3، الحقل محجوز من الأول)
  eta_status        varchar(20) NULL,           -- 'not_submitted' | 'submitted' | 'accepted' | 'rejected'

  notes             text NULL,
  created_by        uuid NOT NULL REFERENCES users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  cancelled_at      timestamptz NULL,

  UNIQUE (company_id, invoice_number)
);

CREATE INDEX idx_invoices_company_status ON invoices(company_id, status);
CREATE INDEX idx_invoices_project ON invoices(project_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_due_date ON invoices(due_date) WHERE status NOT IN ('paid','cancelled');
```

**منطق الحساب:**
```
subtotal          = مبلغ الخدمة قبل الضريبة (مرتبط بقيمة الـ Phase عادة)
vat_amount        = subtotal * vat_rate / 100
wht_amount        = subtotal * wht_rate / 100     (نادرًا ما تُطبَّق WHT على فواتير العملاء نفسها، أكتر شيوعًا في VendorBill — الحقل موجود للمرونة)
total_amount      = subtotal + vat_amount - wht_amount
paid_amount       = SUM(payments.amount WHERE payments.invoice_id = invoices.id)
remaining_amount  = total_amount - paid_amount
status            = يُحدَّث تلقائيًا:
                      remaining_amount <= 0            → 'paid'
                      0 < paid_amount < total_amount   → 'partially_paid'
                      paid_amount = 0 AND due_date < today → 'overdue'
                      غير ذلك → 'sent' (بعد الإصدار) أو 'draft' (قبل الإرسال)
```

### 3.2 `vendors`

```sql
CREATE TABLE vendors (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id),
  name            varchar(150) NOT NULL,
  tax_id          varchar(50) NULL,           -- الرقم الضريبي للمورد
  email           varchar(150) NULL,
  phone           varchar(30) NULL,
  address         text NULL,
  default_wht_rate numeric(5,2) NOT NULL DEFAULT 0,  -- نسبة الخصم والإضافة الافتراضية لهذا المورد حسب نوع الخدمة
  notes           text NULL,
  created_by      uuid NOT NULL REFERENCES users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendors_company ON vendors(company_id);
```

### 3.3 `vendor_bills`

```sql
CREATE TABLE vendor_bills (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id),
  vendor_id       uuid NOT NULL REFERENCES vendors(id),
  project_id      uuid NULL REFERENCES projects(id),   -- nullable: مصروف مورد عام مش مرتبط بمشروع

  bill_number     varchar(50) NULL,           -- رقم فاتورة المورد نفسه (مرجعي)
  bill_date       date NOT NULL,
  due_date        date NOT NULL,

  subtotal        numeric(14,2) NOT NULL,
  vat_rate        numeric(5,2)  NOT NULL DEFAULT 14.00,
  vat_amount      numeric(14,2) NOT NULL DEFAULT 0,
  wht_rate        numeric(5,2)  NOT NULL DEFAULT 0,
  wht_amount      numeric(14,2) NOT NULL DEFAULT 0,
  total_amount    numeric(14,2) NOT NULL,       -- subtotal + vat_amount - wht_amount
  paid_amount     numeric(14,2) NOT NULL DEFAULT 0,
  remaining_amount numeric(14,2) NOT NULL,

  status          varchar(20) NOT NULL DEFAULT 'pending',
  -- status enum: 'pending' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled'

  cost_category   varchar(30) NOT NULL DEFAULT 'other',
  notes           text NULL,
  created_by      uuid NOT NULL REFERENCES users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendor_bills_company_status ON vendor_bills(company_id, status);
CREATE INDEX idx_vendor_bills_vendor ON vendor_bills(vendor_id);
CREATE INDEX idx_vendor_bills_project ON vendor_bills(project_id);
```

> **علاقة مع `Expense` الحالي**: `VendorBill` لا يلغي `Expense`، بل يغطي حالة "مصروف له مورد مسجَّل وفاتورة رسمية وتاريخ استحقاق منفصل عن تاريخ الدفع". المصروفات البسيطة الفورية (زي مصاريف نثرية) تفضل تتسجل في `Expense` مباشرة. عند سداد `VendorBill` بالكامل، يمكن (اختياريًا) إنشاء سجل `Expense` مقابل تلقائيًا للحفاظ على تجانس تقارير `FinancialStats` الحالية (انظر قسم 5).

### 3.4 `vendor_payments`

```sql
CREATE TABLE vendor_payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id),
  vendor_bill_id  uuid NOT NULL REFERENCES vendor_bills(id),
  amount          numeric(14,2) NOT NULL,
  payment_date    date NOT NULL,
  payment_method  varchar(20) NOT NULL,   -- نفس enum الموجود: cash/bank_transfer/credit_card/other
  notes           text NULL,
  created_by      uuid NOT NULL REFERENCES users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendor_payments_bill ON vendor_payments(vendor_bill_id);
```

---

## 4. مخطط العلاقات (ERD مبسّط)

```
clients ──1:N── projects ──1:N── phases
                   │                │
                   │                └──1:N── invoices (phase_id nullable)
                   │
                   ├──1:N── invoices (project_id required)
                   │            │
                   │            └──1:N── payments (invoice_id nullable → advance)
                   │
                   └──1:N── expenses (project_id nullable)
                                │
                                └── N:1 vendors (vendor_id nullable)

vendors ──1:N── vendor_bills ──1:N── vendor_payments
                     │
                     └── N:1 projects (project_id nullable)
```

**قواعد الحذف (ON DELETE):**
- `projects` لا يُحذف لو عليه `invoices` أو `vendor_bills` — يجب Cancel أولًا (منطق تطبيقي، مش قيد DB بالضرورة).
- `invoice_id` في `payments`: `ON DELETE SET NULL` — لو الفاتورة اتلغت، الدفعة ترجع "advance" غير مخصصة بدل ما تتحذف.

---

## 5. التوافق مع الإحصائيات الحالية (`FinancialStats`)

عشان الانتقال ميكسرش شاشة `/dashboard/finance` الحالية فورًا، الحساب الجديد المقترح للـ backend:

```
totalRevenue        = SUM(invoices.subtotal) WHERE status IN ('sent','partially_paid','paid','overdue')
                       AND issue_date BETWEEN from_date AND to_date
                       -- (بدل SUM(payments.amount) القديم — تحول من Cash Basis إلى Accrual Basis)

directExpenses      = SUM(expenses.amount) WHERE type='direct'
                       + SUM(vendor_bills.subtotal) WHERE cost_category IN ('materials','subcontractor','labor')

operationalExpenses = SUM(expenses.amount) WHERE type='operational'
                       + SUM(vendor_bills.subtotal) WHERE cost_category NOT IN ('materials','subcontractor','labor')

-- الباقي (grossProfit, operatingIncome, netProfit, margins) نفس المعادلات الحالية بدون تغيير
```

> **قرار مطلوب من الفريق**: هل نعرض `totalRevenue` الجديد (Accrual/على أساس الفواتير) كبديل كامل، أو نعرض الاتنين جنب بعض لفترة انتقالية (`recognizedRevenue` vs `collectedRevenue`)؟ الأنسب محاسبيًا هو الأول، لكن الأنسب لتجربة مستخدم غير محاسبي (خصوصًا لو صاحب الشركة بيفكر Cash) هو عرض الاتنين مؤقتًا.

### تقرير AR Aging الجديد (مثال شكل الاستجابة)

```json
GET /api/statistics/ar-aging

{
  "buckets": {
    "current":    { "count": 5,  "amount": 45000 },
    "1_30":       { "count": 3,  "amount": 18000 },
    "31_60":      { "count": 1,  "amount": 6000  },
    "61_90":      { "count": 0,  "amount": 0     },
    "over_90":    { "count": 1,  "amount": 12000 }
  },
  "totalOutstanding": 81000,
  "invoices": [
    { "id": "uuid", "invoice_number": "INV-2026-0007", "client_name": "...",
      "due_date": "2026-07-01", "remaining_amount": 12000, "days_overdue": 74 }
  ]
}
```

---

## 6. أمثلة API جديدة مقترحة (متسقة مع نمط الباك إند الحالي)

```
GET    /api/invoices?page=&limit=&project_id=&client_id=&status=&from_date=&to_date=
GET    /api/invoices/:id
POST   /api/invoices                 { client_id, project_id, phase_id?, subtotal, vat_rate?, wht_rate?, due_date, notes? }
PUT    /api/invoices/:id
POST   /api/invoices/:id/send        -- draft → sent
POST   /api/invoices/:id/cancel      -- أي حالة → cancelled (مع سبب)

GET    /api/vendors?page=&limit=&q=
POST   /api/vendors
GET    /api/vendor-bills?page=&limit=&vendor_id=&project_id=&status=
POST   /api/vendor-bills
POST   /api/vendor-bills/:id/payments   { amount, payment_date, payment_method, notes? }

GET    /api/statistics/ar-aging
GET    /api/statistics/ap-aging
GET    /api/statistics/project-profitability?project_id=uuid
```

`payments` API الحالي (`POST /api/payments`) يتوسع بحقل اختياري `invoice_id`:
```json
{ "project_id": "uuid", "invoice_id": "uuid|null", "amount": 5000, "payment_date": "...", "payment_method": "bank_transfer" }
```
لو `invoice_id` اتبعت → السيرفر يحدّث `invoices.paid_amount` و`status` تلقائيًا (transaction واحدة).

---

## 7. أثر التغيير على الفرونت إند الحالي

| الملف | التغيير المطلوب |
|---|---|
| `lib/api.ts` | إضافة `invoicesApi`, `vendorsApi`, `vendorBillsApi` + تحديث `CreateExpenseInput`/`Expense` بـ `project_id`, `cost_category`, `vendor_id` + تحديث `CreatePaymentInput`/`Payment` بـ `invoice_id`, `type` |
| `hooks/` | `use-invoices.ts`, `use-vendors.ts`, `use-vendor-bills.ts` جديدة (نفس نمط `use-payments.ts` الحالي) |
| `app/dashboard/expenses/*` | إضافة اختيار Project (dropdown) + Cost Category في `ExpenseFormModal` |
| `app/dashboard/projects/[id]/page.tsx` | تبويب جديد "Invoices" يعرض فواتير المشروع + حالتها + ربط الدفعات بيها |
| صفحة جديدة `app/dashboard/invoices/` | قائمة كل الفواتير + فلاتر بالحالة/العميل + شاشة AR Aging |
| صفحة جديدة `app/dashboard/vendors/` | إدارة الموردين وفواتيرهم |
| `app/dashboard/finance/page.tsx` | إضافة كارت "Outstanding Receivables" و"Outstanding Payables" بجانب الكروت الحالية |

---

## 8. خطوات التنفيذ المقترحة (Backend أولًا)

1. Migration: تعديل `expenses` و`payments` (الحقول الجديدة nullable — Zero downtime).
2. Migration: إنشاء `vendors`, `vendor_bills`, `vendor_payments`, `invoices`.
3. Backend: CRUD endpoints للجداول الجديدة + منطق تحديث `paid_amount`/`status` تلقائيًا عند إنشاء Payment/VendorPayment (داخل DB transaction).
4. Backend: تعديل `/api/statistics/financial` ليدعم الحساب الجديد (مع علم/parameter `basis=accrual|cash` أثناء الفترة الانتقالية).
5. Backend: endpoint `ar-aging` و`ap-aging`.
6. Frontend: تحديث `lib/api.ts` والـ types (كما في قسم 7) — بدون كسر أي شاشة حالية لأن كل الحقول الجديدة اختيارية.
7. Frontend: الشاشات الجديدة (Invoices, Vendors) + تعديل ExpenseForm.
8. اختبار الانتقال: تشغيل الحساب القديم والجديد جنب بعض على بيانات حقيقية والتأكد إن الفرق منطقي (فروق مؤقتة بسبب Accrual vs Cash متوقعة وطبيعية).
