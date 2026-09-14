# نظرة عامة على النظام — Project Management System (Frontend v1)

> توثيق شامل للحالة الحالية للمشروع (Frontend فقط) — تم إنشاؤه بمراجعة الكود الفعلي بتاريخ 2026-09-14.

---

## 1. نبذة عامة

هذا المشروع هو **الواجهة الأمامية (Frontend)** لنظام إدارة مشاريع شركة (Project Management System) خاص بشركة "CodeWars"، ويشمل جزئين رئيسيين:

1. **لوحة تحكم داخلية (Dashboard)** — يستخدمها موظفو الشركة لإدارة العملاء، المشاريع، الفواتير، المدفوعات، المصروفات، الموردين، والفريق.
2. **بوابة العميل (Client Portal)** — واجهة منفصلة يدخل عليها العميل نفسه لمتابعة مشاريعه وفواتيره واعتماد المراحل (Phases).

الباك إند منفصل تمامًا ومستضاف على:
`https://project-management-system-backend-v.vercel.app/`
(يُضبط عبر `NEXT_PUBLIC_API_URL` في `.env.local`)

---

## 2. المكدس التقني (Tech Stack)

| الفئة | التقنية |
|---|---|
| Framework | Next.js 16.1.6 (App Router) |
| UI Library | React 19.2.3 |
| اللغة | TypeScript 5 |
| التنسيق (Styling) | Tailwind CSS 4 |
| إدارة حالة السيرفر | @tanstack/react-query 5 |
| النماذج (Forms) | react-hook-form + zod + @hookform/resolvers |
| HTTP Client | axios |
| إدارة الكوكيز | js-cookie |
| الأيقونات | lucide-react |
| Linting | ESLint 9 (eslint-config-next) |

لا يوجد اختبارات آلية (unit/e2e tests) في المشروع حاليًا.

---

## 3. هيكل المجلدات

```
app/
├── layout.tsx                 # Root layout
├── page.tsx                   # الصفحة الرئيسية (redirect)
├── login/                     # تسجيل دخول موظفي الشركة
├── dashboard/                 # لوحة التحكم الداخلية (محمية بـ Auth)
│   ├── layout.tsx             # Sidebar + Header + AuthProvider guard
│   ├── page.tsx                # Dashboard الرئيسي (إحصائيات)
│   ├── clients/                # إدارة العملاء
│   ├── projects/               # إدارة المشاريع (+ Phases, Tasks, Team)
│   ├── invoices/                # الفواتير (+ ar-aging, ap-aging)
│   ├── payments/                # المدفوعات
│   ├── expenses/                # المصروفات
│   ├── vendors/                 # الموردين وفواتيرهم (Vendor Bills)
│   ├── finance/                  # نظرة مالية عامة
│   └── team/                     # إدارة الفريق وعبء العمل (Workload)
└── portal/                     # بوابة العميل (Auth منفصل)
    ├── layout.tsx               # PortalAuthProvider guard
    ├── login/                    # تسجيل دخول العميل
    ├── accept-invite/            # قبول دعوة عضو بوابة جديد
    ├── page.tsx                   # قائمة مشاريع العميل
    ├── projects/[id]/              # تفاصيل مشروع + اعتماد المراحل
    └── invoices/                   # فواتير العميل

components/                    # مكونات مقسّمة حسب الدومين (clients, projects, tasks, invoices...)
components/ui/                 # مكونات UI عامة قابلة لإعادة الاستخدام (Button, Modal, Table, Tabs...)
hooks/                         # React Query hooks لكل دومين (use-clients, use-projects, use-tasks...)
lib/
├── api.ts                     # عميل axios + جميع تعريفات الـ API الداخلي (dashboard) + الأنواع (TypeScript types)
├── portal-api.ts               # عميل axios منفصل + API الخاص ببوابة العميل
├── auth-context.tsx            # Context الخاص بمصادقة الموظفين
├── portal-auth-context.tsx     # Context الخاص بمصادقة العميل
├── config.ts / portal-config.ts # API_BASE + أسماء التوكنات (كوكيز منفصلة)
├── error-bus.ts / error-utils.ts # نظام مركزي لعرض أخطاء الـ API كـ Toast
├── status-badges.ts            # ألوان/تسميات حالات الفواتير والمهام...
└── providers.tsx                # QueryClientProvider wrapper
```

---

## 4. المصادقة (Authentication)

يوجد **نظامان منفصلان تمامًا** للمصادقة، لكل منهما axios instance مستقل وكوكي توكن مستقل حتى لا تتداخل جلسة الموظف مع جلسة العميل في نفس المتصفح:

| | لوحة التحكم (Dashboard) | بوابة العميل (Portal) |
|---|---|---|
| Context | `lib/auth-context.tsx` (`useAuth`) | `lib/portal-auth-context.tsx` (`usePortalAuth`) |
| API client | `lib/api.ts` (`api`) | `lib/portal-api.ts` (`portalApi`) |
| اسم كوكي التوكن | `pms_token` (`TOKEN_KEY`) | مُعرّف في `portal-config.ts` (`PORTAL_TOKEN_KEY`) |
| نقطة الدخول | `/login` | `/portal/login` |
| عند 401 | حذف الكوكي + Redirect لـ `/login` | حذف الكوكي + Redirect لـ `/portal/login` |
| صلاحية الجلسة | كوكي 7 أيام (`expires: 7`) | — |

الطلبات تُرفق تلقائيًا بـ `Authorization: Bearer <token>` عبر axios interceptor في كلا العميلين.

---

## 5. الوحدات الوظيفية (Modules) — لوحة التحكم

### 5.1 Dashboard الرئيسي (`/dashboard`)
إحصائيات عامة: عدد العملاء، المشاريع، قيمة المشاريع الإجمالية، المدفوعات المستلمة، المصروفات، توزيع المشاريع حسب الحالة، وملخص مالي (`statisticsApi.dashboard`).

### 5.2 العملاء (Clients) — `/dashboard/clients`
- CRUD كامل للعملاء (اسم، إيميل، هاتف، عنوان، ملاحظات، تقييم/feedback).
- صفحة تفاصيل عميل (`[id]`) تعرض ملخص المدفوعات (`ClientPaymentSummary`: الإجمالي المستحق، المدفوع، المتبقي).
- إدارة **مستخدمي بوابة العميل** من نفس الصفحة: دعوة مستخدم جديد (Invite)، سحب الصلاحية (Revoke) — عبر `clientPortalApi` و`PortalAccessCard` / `InvitePortalUserForm`.

### 5.3 المشاريع (Projects) — `/dashboard/projects`
- CRUD للمشاريع: عنوان، تفاصيل، عميل مرتبط، تاريخ بدء/استحقاق، السعر، الحالة (`draft, active, on_hold, cancelled, completed`).
- صفحة تفاصيل المشروع (`[id]`) تحتوي على تبويبات (Tabs) لعدة أقسام فرعية:
  - **المراحل (Phases)**: كل مرحلة لها تاريخ بدء/انتهاء ومبلغ (`amount`) — تُستخدم كأساس للفوترة.
  - **المهام (Tasks)**: نظام مهام كامل (انظر 5.3.1).
  - **الفريق (Project Team)**: أعضاء المشروع وأدوارهم (`ProjectTeamTab`).
  - **الجدول الزمني (Timeline/Gantt)**: عرض Gantt للمراحل والمهام مع الاعتماديات.
  - **المدفوعات**: مدفوعات المشروع (`projectsApi.payments`).

#### 5.3.1 نظام المهام (Tasks) — تفصيل
مطبّق بشكل شبه كامل (Jira-lite) داخل صفحة المشروع:
- حالات المهمة: `todo, in_progress, in_review, done, blocked`.
- أولوية المهمة: `low, medium, high, urgent`.
- **Kanban Board** (`KanbanBoard.tsx`) لعرض المهام حسب الحالة.
- **Gantt Chart** (`GanttChart.tsx`) لعرض المهام/المراحل زمنيًا.
- مهام فرعية (Subtasks) عبر `parent_task_id` (`SubtaskList.tsx`).
- Checklist لكل مهمة (`ChecklistPanel.tsx`) — عناصر قابلة للإتمام مع ترتيب (position).
- اعتماديات بين المهام (Task Dependencies) — `dependsOn`.
- إسناد مهمة لعضو فريق (assignee)، إعادة ترتيب المهام (reorder).

### 5.4 الفريق (Team) — `/dashboard/team`
- عرض عبء العمل (Workload) لكل عضو فريق: عدد المشاريع النشطة، نسبة التخصيص الكلي، عدد المهام المفتوحة والمتأخرة (`teamApi.workload`).
- إدارة أعضاء المشروع (إضافة/تعديل دور/حذف) عبر `projectMembersApi`.

### 5.5 الفواتير (Invoices) — `/dashboard/invoices`
- CRUD للفواتير مرتبطة بعميل ومشروع (واختياريًا مرحلة معينة).
- حسابات ضريبية: `vat_rate/vat_amount` (ضريبة القيمة المضافة) و`wht_rate/wht_amount` (ضريبة الخصم تحت الحساب).
- حالات: `draft, sent, partially_paid, paid, overdue, cancelled`.
- إجراءات: إرسال الفاتورة (`send`)، إلغاؤها مع سبب (`cancel`).
- صفحة تفاصيل فاتورة تعرض المدفوعات المرتبطة بها.
- **تقارير أعمار الذمم**:
  - `AR Aging` (`/dashboard/invoices/ar-aging`) — أعمار مديونية العملاء (Accounts Receivable).
  - `AP Aging` (`/dashboard/invoices/ap-aging`) — أعمار مديونية الموردين (Accounts Payable).
  - كلاهما يقسّم المبالغ إلى Buckets: `current, 1-30, 31-60, 61-90, over_90`.

### 5.6 المدفوعات (Payments) — `/dashboard/payments`
- تسجيل مدفوعات مرتبطة بمشروع (واختياريًا بفاتورة معينة).
- نوع الدفعة: `advance` (دفعة مقدمة) أو `invoice_settlement` (تسوية فاتورة).
- طرق الدفع: `cash, bank_transfer, credit_card, other`.

### 5.7 المصروفات (Expenses) — `/dashboard/expenses`
- نوعان: `direct` (مباشرة على مشروع/مرحلة) أو `operational` (تشغيلية عامة).
- تصنيف تكلفة (Cost Category): `labor, materials, subcontractor, software, travel, marketing, rent, utilities, other`.
- يمكن ربط المصروف بمشروع/مرحلة/مورد.

### 5.8 الموردين (Vendors) وفواتيرهم — `/dashboard/vendors`
- CRUD للموردين (اسم، رقم ضريبي، نسبة خصم افتراضية `default_wht_rate`).
- **فواتير الموردين (Vendor Bills)**: نفس منطق فواتير العملاء لكن بالاتجاه المعاكس (التزامات الشركة تجاه المورد) — حالات وحسابات ضريبية مشابهة.
- تسجيل دفعات على فاتورة المورد (`VendorBillPaymentModal`).

### 5.9 النظرة المالية العامة (Finance) — `/dashboard/finance`
تقرير مالي شامل (`statisticsApi.financial`) يحسب:
- إجمالي الإيرادات، المصروفات المباشرة والتشغيلية.
- الربح الإجمالي وهامشه (Gross Profit/Margin).
- الدخل التشغيلي وهامشه.
- صافي الربح وهامشه.
- يدعم أساس محاسبي (`basis`): `accrual` (استحقاق) أو `cash` (نقدي).
- **ربحية المشروع (Project Profitability)**: لكل مشروع — الإيراد المُعترف به والمُحصّل، إجمالي التكلفة (مقسّمة حسب الفئة)، الربح الإجمالي، الانحراف عن الموازنة المحددة.

---

## 6. بوابة العميل (Client Portal) — `/portal`

واجهة منفصلة يدخلها العميل عبر حساب بوابة خاص به (مُنشأ من قبل الشركة عبر "Invite" في صفحة تفاصيل العميل):

- **تسجيل الدخول** (`/portal/login`) وقبول دعوة (`/portal/accept-invite`) بتوكن دعوة + كلمة مرور.
- **قائمة المشاريع** الخاصة بالعميل (قراءة فقط، مفلترة تلقائيًا من السيرفر حسب العميل المسجّل دخوله).
- **تفاصيل مشروع**: يعرض المراحل والجدول الزمني (Timeline)، مع إمكانية **اعتماد مرحلة (Approve Phase)** من قبل العميل (`approvePhase`) — يسجّل `client_approved_at`.
- **الفواتير**: عرض فواتير العميل وتفاصيلها.
- **ملخص المدفوعات**: إجمالي المطلوب، المدفوع، المتبقي.

كل هذه الـ endpoints للقراءة فقط ماعدا اعتماد المرحلة، والبيانات تُرجع من السيرفر مُفلترة تلقائيًا حسب هوية العميل (لا فلترة يدوية على الفرونت).

---

## 7. مكونات UI العامة (`components/ui/`)

مكتبة UI داخلية بسيطة مبنية بـ Tailwind، تشمل: `Button, Card, Badge, Modal, ConfirmDialog, Input, Textarea, Select, CustomSelect, Table, Tabs, Skeleton, ErrorToast`.

- `ErrorToast` + `error-bus.ts`: نظام مركزي — أي خطأ من axios (باستثناء 401) يُنشر (publish) على "error bus" ويُعرض تلقائيًا كـ Toast في الواجهة دون الحاجة لمعالجة يدوية في كل صفحة.
- `status-badges.ts`: دالة موحّدة لتحويل حالة (فاتورة/مهمة/مشروع...) إلى لون وتسمية Badge متسقة عبر التطبيق.

---

## 8. نموذج البيانات (النطاقات الرئيسية)

المصادر الكاملة للأنواع موجودة في `lib/api.ts` (للـ Dashboard) و`lib/portal-api.ts` (للبوابة). أهم الكيانات:

- **Client** — العميل.
- **Project** — المشروع (مرتبط بعميل، له حالة وسعر وتواريخ).
- **Phase** — مرحلة من مراحل المشروع (تاريخ، مبلغ) — أساس الفوترة والاعتماد من العميل.
- **Task / ChecklistItem** — المهام وعناصر قوائم التحقق، بدعم مهام فرعية واعتماديات.
- **ProjectMember / WorkloadMember** — عضوية المشروع وعبء العمل.
- **Invoice / Payment** — فواتير العملاء ومدفوعاتها.
- **Vendor / VendorBill / VendorPayment** — الموردين وفواتيرهم ومدفوعاتها.
- **Expense** — المصروفات (مباشرة/تشغيلية).
- **ClientPortalUser** — مستخدم بوابة العميل.
- **DashboardStats / FinancialStats / AgingReport / ProjectProfitability** — نماذج التقارير والإحصائيات.

جميع الكيانات تنتمي إلى `company_id` — أي أن النظام مصمم ليكون **متعدد الشركات (Multi-tenant)** من ناحية الباك إند، حيث يُحدَّد نطاق البيانات تلقائيًا حسب شركة المستخدم المسجل دخوله.

---

## 9. نقاط ملاحظة مهمة

- **لا يوجد اختبارات (tests)** في المشروع حاليًا (لا Jest ولا Playwright ولا غيره).
- **لا يوجد state management عام (Redux/Zustand)** — الاعتماد كليًا على React Query لحالة السيرفر و React Context للمصادقة فقط.
- ملف `PATHES.js` في جذر المشروع **فارغ تمامًا** (غير مستخدم حاليًا).
- `README.md` لا يزال هو القالب الافتراضي لـ `create-next-app` ولا يعكس طبيعة المشروع الفعلية.
- `usersApi.shortList` في `lib/api.ts` مُعلَّم بتعليق يوضح أنه **ليس جزءًا من مواصفات الباك إند الأصلية** (PMS-PM-FEATURES) بل أُضيف خصيصًا لتغذية قائمة اختيار الموظفين عند إضافة عضو لمشروع.
- الاتصال بالباك إند عبر متغيّر بيئة واحد فقط: `NEXT_PUBLIC_API_URL` (افتراضيًا يشير لنسخة Vercel المنشورة للباك إند).

---

## 10. خريطة الروابط (Routes) الكاملة

### لوحة التحكم
| الرابط | الوصف |
|---|---|
| `/login` | تسجيل دخول الموظف |
| `/dashboard` | الصفحة الرئيسية / إحصائيات |
| `/dashboard/clients`, `/dashboard/clients/[id]` | العملاء |
| `/dashboard/projects`, `/dashboard/projects/[id]` | المشاريع (+ مراحل/مهام/فريق/جدول زمني) |
| `/dashboard/team` | الفريق وعبء العمل |
| `/dashboard/invoices`, `/dashboard/invoices/[id]` | الفواتير |
| `/dashboard/invoices/ar-aging` | تقرير أعمار ذمم العملاء |
| `/dashboard/invoices/ap-aging` | تقرير أعمار ذمم الموردين |
| `/dashboard/payments` | المدفوعات |
| `/dashboard/expenses` | المصروفات |
| `/dashboard/vendors`, `/dashboard/vendors/[id]` | الموردين وفواتيرهم |
| `/dashboard/finance` | النظرة المالية العامة |

### بوابة العميل
| الرابط | الوصف |
|---|---|
| `/portal/login` | تسجيل دخول العميل |
| `/portal/accept-invite` | قبول دعوة الانضمام للبوابة |
| `/portal` | قائمة مشاريع العميل |
| `/portal/projects/[id]` | تفاصيل المشروع + اعتماد المراحل |
| `/portal/invoices`, `/portal/invoices/[id]` | فواتير العميل |

---

*تم إنشاء هذا الملف تلقائيًا بواسطة Claude Code بناءً على مراجعة فعلية لكود المشروع (بدون افتراضات غير موثقة في الكود).*
