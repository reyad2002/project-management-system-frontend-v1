# ملف تنفيذ الباك إند — المرحلة 1

هذا الملف موجَّه لمن سينفّذ الـ endpoints الجديدة والتعديلات على الباك إند الحالي. مكتوب بنفس نمط `FRONTEND-API-REPORT.md` الموجود بالفعل (نفس شكل الـ Base URL, Auth, Pagination, Error format) عشان يبقى متسق مع الـ API الحالي. يفترض إن قاعدة البيانات اتنفذت فعلًا حسب [`PMS-PHASE1-DATABASE-SUPABASE.md`](./PMS-PHASE1-DATABASE-SUPABASE.md).

**كل المسارات تحت `/api/...` وتحتاج `Authorization: Bearer <token>` بنفس آلية الـ Auth الحالية. كل الاستعلامات لازم تُفلتر تلقائيًا بـ `company_id` الخاص بالمستخدم الحالي (من التوكن) — بالضبط زي باقي الـ endpoints الحالية.**

---

## 1. تعديلات على Endpoints موجودة

### 1.1 `POST /api/expenses` و `PUT /api/expenses/:id`

إضافة حقول اختيارية جديدة للـ body:

```json
{
  "amount": 5000,
  "expense_date": "2026-09-01",
  "title": "شراء تراخيص برمجيات",
  "description": "...",
  "type": "direct",
  "project_id": "uuid | null",
  "phase_id": "uuid | null",
  "vendor_id": "uuid | null",
  "cost_category": "software"
}
```

- `cost_category` enum: `labor | materials | subcontractor | software | travel | marketing | rent | utilities | other` (افتراضي `other`).
- `project_id`/`phase_id`/`vendor_id`: اختيارية بالكامل، `null` = مصروف عام (سلوك مطابق للحالي 100%).
- **Validation**: لو `phase_id` مبعوت لازم يكون تابع لنفس `project_id` المبعوت — وإلا `400 Bad Request` برسالة `"phase does not belong to project"`.

`GET /api/expenses` — إضافة query params اختيارية: `project_id`, `vendor_id`, `cost_category`.

### 1.2 `POST /api/payments` و `PUT /api/payments/:id`

```json
{
  "project_id": "uuid",
  "invoice_id": "uuid | null",
  "amount": 5000,
  "payment_date": "2026-09-01",
  "payment_method": "bank_transfer",
  "type": "invoice_settlement",
  "notes": "..."
}
```

- `type` enum: `advance | invoice_settlement` (افتراضي `invoice_settlement` لو `invoice_id` موجود، و`advance` لو مش موجود).
- **منطق مهم (Transaction واحدة)**: عند إنشاء/تعديل/حذف Payment له `invoice_id`:
  1. احسب `paid_amount` الجديد للفاتورة = `SUM(payments.amount WHERE invoice_id = ...)`.
  2. حدّث `remaining_amount = total_amount - paid_amount`.
  3. حدّث `status`:
     - `remaining_amount <= 0` → `paid`
     - `paid_amount > 0` → `partially_paid`
     - `paid_amount = 0` و `due_date < today` → `overdue`
     - غير ذلك → يفضل زي ما هو (`sent`)
  4. **لو الفاتورة `status = 'cancelled'`، ارفض العملية بـ `409 Conflict`** — "cannot add payment to a cancelled invoice".
  5. **Validation**: `amount` الجديد + الموجود بالفعل لازم ميتجاوزش `total_amount` الفاتورة (نرفض Overpayment بـ `400`، أو نسمح ونعرض رصيد سالب كـ "credit" — **قرار عمل مطلوب من الفريق**، الافتراضي المقترح: رفض).

> **ملاحظة تنفيذية**: لو الـ DB triggers (قسم 6 في ملف الداتابيز) شغالة، الحساب هيحصل تلقائيًا حتى لو الباك إند عمل `INSERT` بسيط. لكن **الـ validation (رفض Overpayment، رفض الدفع على فاتورة ملغية) لازم يتعمل في الباك إند قبل الـ INSERT** لإعطاء رسالة خطأ واضحة للمستخدم بدل ما يفشل على مستوى الـ DB بشكل غامض.

---

## 2. الفواتير (Invoices) — Endpoints جديدة

**Base:** `/api/invoices`

### 2.1 قائمة الفواتير

```http
GET /api/invoices?page=1&limit=20&project_id=uuid&client_id=uuid&status=overdue&from_date=&to_date=
```

| Query | الوصف |
|---|---|
| `project_id`, `client_id` | فلترة |
| `status` | `draft\|sent\|partially_paid\|paid\|overdue\|cancelled` |
| `from_date`, `to_date` | فلترة على `issue_date` |

**Response 200:**
```json
{
  "invoices": [
    {
      "id": "uuid", "company_id": "uuid", "client_id": "uuid", "project_id": "uuid", "phase_id": "uuid|null",
      "invoice_number": "INV-2026-0007", "issue_date": "2026-09-01", "due_date": "2026-09-15",
      "currency": "EGP", "subtotal": 20000, "vat_rate": 14, "vat_amount": 2800, "wht_rate": 0, "wht_amount": 0,
      "total_amount": 22800, "paid_amount": 10000, "remaining_amount": 12800,
      "status": "partially_paid", "notes": "...", "created_at": "ISO8601"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 34 }
}
```

### 2.2 فاتورة واحدة

```http
GET /api/invoices/:id
```
**200** — كائن الفاتورة (نفس الشكل أعلاه) + مصفوفة `payments` المرتبطة بيها. **404** إن لم توجد.

### 2.3 إنشاء فاتورة

```http
POST /api/invoices
```
```json
{
  "client_id": "uuid",
  "project_id": "uuid",
  "phase_id": "uuid | null",
  "issue_date": "2026-09-01",
  "due_date": "2026-09-15",
  "subtotal": 20000,
  "vat_rate": 14,
  "wht_rate": 0,
  "notes": "دفعة المرحلة الأولى"
}
```
- `invoice_number` يُولَّد تلقائيًا في الباك إند (أو عبر DB trigger — اختر مكان واحد فقط لتفادي التكرار، **الموصى به: الباك إند يولّده صراحة قبل الإرسال لضمان التحكم فيه**، مع الاعتماد على الـ trigger كـ fallback فقط).
- **Validation**: `client_id` لازم يكون عميل المشروع (`project.client_id === client_id`) — وإلا `400`.
- `status` يبدأ دائمًا `draft`.
- **201** — الفاتورة المُنشأة.

### 2.4 تحديث فاتورة

```http
PUT /api/invoices/:id
```
- مسموح فقط في حالة `draft` (فاتورة اتبعتت أو اتدفعت جزئيًا لا تُعدَّل مباشرة — **قاعدة محاسبية أساسية للحفاظ على الأثر التدقيقي**؛ التعديل بعد الإرسال يكون عبر Credit Note في مرحلة لاحقة). لو الحالة مش `draft` → `409 Conflict`.

### 2.5 إرسال الفاتورة

```http
POST /api/invoices/:id/send
```
- ينقل الحالة من `draft` إلى `sent`. لو الحالة مش `draft` → `409`.
- **200** — الفاتورة بعد التحديث.

### 2.6 إلغاء الفاتورة

```http
POST /api/invoices/:id/cancel
```
```json
{ "reason": "خطأ في المبلغ، سيُعاد إصدارها" }
```
- مسموح من أي حالة ما عدا `paid` (فاتورة مدفوعة بالكامل لا تُلغى — لو محتاج استرجاع، ده Credit Note لاحقًا). لو فيها Payments مرتبطة، الـ trigger هيفك ربطها تلقائيًا (`invoice_id = null`, `type = 'advance'`) بحكم `ON DELETE SET NULL`... **لكن هنا مش حذف فاتورة، فلازم الباك إند صراحة يحدّث الـ payments المرتبطة لتبقى `type='advance'` و `invoice_id=null` عند الإلغاء** (منطق تطبيقي، مش DB constraint).
- **200** — الفاتورة بحالة `cancelled` + `cancelled_at`.

---

## 3. الموردين (Vendors) — Endpoints جديدة

**Base:** `/api/vendors`

```
GET    /api/vendors?page=&limit=&q=          → { vendors: Vendor[], pagination }
GET    /api/vendors/shortList                 → { vendors: [{ id, name }] }   (لنفس نمط clients/projects shortList)
GET    /api/vendors/:id                       → Vendor
POST   /api/vendors                           → { name, tax_id?, email?, phone?, address?, default_wht_rate?, notes? }
PUT    /api/vendors/:id
DELETE /api/vendors/:id                       → 204 (يُرفض بـ 409 لو عنده vendor_bills مرتبطة)
```

---

## 4. فواتير الموردين (Vendor Bills) — Endpoints جديدة

**Base:** `/api/vendor-bills`

### 4.1 قائمة

```http
GET /api/vendor-bills?page=&limit=&vendor_id=&project_id=&status=
```
**Response:** نفس شكل الفواتير لكن بحقول `vendor_bills` (قسم 4.3 في ملف الداتا موديل).

### 4.2 إنشاء

```http
POST /api/vendor-bills
```
```json
{
  "vendor_id": "uuid",
  "project_id": "uuid | null",
  "bill_number": "V-INV-2044",
  "bill_date": "2026-09-01",
  "due_date": "2026-09-20",
  "subtotal": 8000,
  "vat_rate": 14,
  "wht_rate": 1,
  "cost_category": "subcontractor",
  "notes": "..."
}
```
- `wht_rate` الافتراضي يُؤخذ من `vendor.default_wht_rate` لو مش مبعوت صراحة.

### 4.3 تسجيل دفعة على فاتورة مورد

```http
POST /api/vendor-bills/:id/payments
```
```json
{ "amount": 4000, "payment_date": "2026-09-05", "payment_method": "bank_transfer", "notes": "" }
```
- نفس منطق تحديث `paid_amount`/`status` الموضح في قسم 1.2 لكن على `vendor_bills`.
- **201** — سجل `vendor_payment` المُنشأ + الفاتورة المحدَّثة.

```
GET    /api/vendor-bills/:id                  → VendorBill + payments[]
PUT    /api/vendor-bills/:id                  → مسموح فقط لو status='pending' (نفس قاعدة الفواتير)
DELETE /api/vendor-bills/:id                  → soft: ينقلها لـ status='cancelled' بدل حذف فعلي
```

---

## 5. الإحصائيات — تعديلات وEndpoints جديدة

### 5.1 `GET /api/statistics/financial` (تعديل)

إضافة query param اختياري `basis` (افتراضي `accrual`):

```http
GET /api/statistics/financial?from_date=&to_date=&basis=accrual
```

**منطق الحساب الجديد (`basis=accrual`, الافتراضي):**
```
totalRevenue        = SUM(invoices.subtotal)
                       WHERE status IN ('sent','partially_paid','paid','overdue')
                       AND issue_date BETWEEN from_date AND to_date

directExpenses      = SUM(expenses.amount WHERE type='direct')
                       + SUM(vendor_bills.subtotal WHERE cost_category IN ('materials','subcontractor','labor'))

operationalExpenses = SUM(expenses.amount WHERE type='operational')
                       + SUM(vendor_bills.subtotal WHERE cost_category NOT IN ('materials','subcontractor','labor'))

totalExpenses = directExpenses + operationalExpenses
grossProfit = totalRevenue - directExpenses
operatingIncome = grossProfit - operationalExpenses
netProfit = operatingIncome   (لا يوجد ضرائب دخل/فوائد في هذه المرحلة)
```

**لو `basis=cash`** (للتوافق المؤقت مع الشاشة الحالية والسلوك القديم):
```
totalRevenue = SUM(payments.amount)   -- السلوك الحالي تمامًا قبل التعديل
```

**Response** — نفس الشكل الحالي (`FinancialStats`) + حقل إضافي `basis: "accrual" | "cash"` في الاستجابة للتوضيح.

### 5.2 `GET /api/statistics/ar-aging` (جديد)

```http
GET /api/statistics/ar-aging?client_id=&project_id=
```

**Response 200:**
```json
{
  "buckets": {
    "current": { "count": 5, "amount": 45000 },
    "1_30":    { "count": 3, "amount": 18000 },
    "31_60":   { "count": 1, "amount": 6000 },
    "61_90":   { "count": 0, "amount": 0 },
    "over_90": { "count": 1, "amount": 12000 }
  },
  "totalOutstanding": 81000,
  "invoices": [
    { "id": "uuid", "invoice_number": "INV-2026-0007", "client_id": "uuid", "client_name": "...",
      "project_id": "uuid", "due_date": "2026-07-01", "remaining_amount": 12000, "days_overdue": 74, "bucket": "over_90" }
  ]
}
```
يُبنى مباشرة من `v_ar_aging` (الـ view في ملف الداتابيز) — تجميع بالـ bucket + مصفوفة تفصيلية.

### 5.3 `GET /api/statistics/ap-aging` (جديد)

نفس شكل 5.2 تمامًا لكن مبني على `v_ap_aging` وحقول `vendor_id`/`vendor_name` بدل العميل.

### 5.4 `GET /api/statistics/project-profitability` (جديد)

```http
GET /api/statistics/project-profitability?project_id=uuid
```
**Response 200:**
```json
{
  "project_id": "uuid",
  "title": "...",
  "recognizedRevenue": 60000,
  "collectedRevenue": 45000,
  "totalCost": 22000,
  "costBreakdown": { "labor": 8000, "materials": 5000, "subcontractor": 9000, "other": 0 },
  "grossProfit": 38000,
  "grossMargin": 63.3,
  "budgetedCost": null,
  "budgetVariance": null
}
```
> `budgetedCost`/`budgetVariance` محجوزين للمرحلة 2 (بعد إضافة حقل الميزانية) — يرجعوا `null` حاليًا.

بدون `project_id` (يرجّع قائمة لكل المشاريع مرتبة بالأعلى ربحية):
```http
GET /api/statistics/project-profitability
```
**Response:** `{ "projects": [ { ...same shape as above... } ], "pagination": {...} }`

---

## 6. تنسيق الأخطاء (بنفس نمط النظام الحالي)

استخدم نفس شكل الأخطاء الموجود في قسم "10. تنسيق الأخطاء" بـ `FRONTEND-API-REPORT.md` لكل الـ endpoints الجديدة. أمثلة أخطاء خاصة بالمرحلة دي:

| الحالة | كود | الرسالة |
|---|---|---|
| فاتورة بحالة غير `draft` تتعدل | 409 | `"Invoice cannot be edited after it has been sent"` |
| دفعة على فاتورة `cancelled` | 409 | `"Cannot add payment to a cancelled invoice"` |
| Overpayment | 400 | `"Payment amount exceeds invoice remaining balance"` |
| `phase_id` مش تابع لنفس `project_id` | 400 | `"Phase does not belong to the specified project"` |
| حذف Vendor عنده فواتير | 409 | `"Cannot delete vendor with existing bills"` |
| فاتورة `paid` تتلغي | 409 | `"Cannot cancel a fully paid invoice"` |

---

## 7. ترتيب تنفيذ الباك إند المقترح

```
[ ] تعديل Models/Schemas لـ Expense و Payment (الحقول الجديدة)
[ ] Endpoints: Vendors CRUD (الأبسط، بدون منطق حسابي)
[ ] Endpoints: Invoices CRUD + send/cancel + منطق الحساب (subtotal→vat→wht→total)
[ ] Endpoints: Vendor Bills CRUD + Vendor Payments sub-resource
[ ] تعديل POST/PUT /api/payments لدعم invoice_id + منطق تحديث الفاتورة (transaction)
[ ] تعديل GET /api/statistics/financial (accrual/cash toggle)
[ ] Endpoints: ar-aging, ap-aging, project-profitability
[ ] اختبار end-to-end: إنشاء فاتورة → إرسال → تسجيل دفعة جزئية → دفعة نهائية → التأكد status='paid'
[ ] اختبار: إلغاء فاتورة عليها دفعات مقدمة → التأكد إنها ترجع advance
```
