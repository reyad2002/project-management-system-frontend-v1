# نظرة عامة على النظام — Project Management System (Frontend v1)

> توثيق شامل للحالة الحالية للمشروع (Frontend فقط) — محدّث بمراجعة الكود الفعلي بتاريخ 2026-09-14 (بعد إضافة ميزات بوابة العميل الجديدة وإزالة/تعديل بعض الأقسام).

---

## 1. نبذة عامة

هذا المشروع هو **الواجهة الأمامية (Frontend)** لنظام إدارة مشاريع شركة (Project Management System) خاص بشركة "CodeWars"، ويشمل جزئين رئيسيين:

1. **لوحة تحكم داخلية (Dashboard)** — يستخدمها موظفو الشركة لإدارة العملاء، المشاريع، الفواتير، المدفوعات، المصروفات، الموردين، والميتنجات وبيانات الدخول الخاصة بكل مشروع.
2. **بوابة العميل (Client Portal)** — واجهة منفصلة يدخل عليها العميل نفسه لمتابعة مشاريعه، فواتيره، الميتنجات، المهام المطلوبة منه، اعتماد المراحل، وتقييم التجربة.

الباك إند منفصل تمامًا (ريبو مستقل) ومستضاف على:
`https://project-management-system-backend-v.vercel.app/`
(يُضبط عبر `NEXT_PUBLIC_API_URL` في `.env.local`، وقاعدة البيانات Supabase Postgres).

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

## 3. هيكل المجلدات (محدّث)

```
app/
├── layout.tsx                 # Root layout
├── page.tsx                   # الصفحة الرئيسية (redirect)
├── login/                     # تسجيل دخول موظفي الشركة
├── dashboard/                 # لوحة التحكم الداخلية (محمية بـ Auth)
│   ├── layout.tsx             # Sidebar + Header + AuthProvider guard
│   ├── page.tsx                # Dashboard الرئيسي (إحصائيات)
│   ├── clients/                # إدارة العملاء + بوابة العميل (دعوة/سحب صلاحية)
│   ├── projects/                # إدارة المشاريع (+ Phases, Tasks, Meetings, Links, Credentials, Payments, Invoices)
│   ├── invoices/                 # الفواتير (+ ar-aging, ap-aging)
│   ├── payments/                  # المدفوعات
│   ├── expenses/                   # المصروفات
│   ├── vendors/                     # الموردين وفواتيرهم (Vendor Bills)
│   └── finance/                      # نظرة مالية عامة
└── portal/                     # بوابة العميل (Auth منفصل)
    ├── layout.tsx               # PortalAuthProvider guard
    ├── login/                    # تسجيل دخول العميل
    ├── accept-invite/            # قبول دعوة عضو بوابة جديد
    ├── page.tsx                   # قائمة مشاريع العميل
    ├── projects/[id]/              # تفاصيل مشروع: Phases, Meetings, Links, Credentials, For you
    └── invoices/                   # فواتير العميل

components/                    # مكونات مقسّمة حسب الدومين
├── clients/                    # ClientForm, PortalAccessCard (دعوة عميل للبوابة + نسخ اللينك يدويًا), InvitePortalUserForm
├── projects/                   # ProjectForm, ProjectLinksTab
├── phases/                     # PhaseForm
├── tasks/                      # TaskForm, TaskCard, KanbanBoard, ChecklistPanel, SubtaskList
├── meetings/                   # MeetingForm, MeetingNoteForm (+ Action Items), MeetingsTab
├── credentials/                # CredentialForm, CredentialsTab, RevealPasswordCell, CredentialAccessLogModal
├── invoices/ payments/ expenses/ vendors/ vendor-bills/
├── portal/                     # PortalHeader, PortalMeetingsTab, PortalMeetingNotesModal, PortalProjectLinksTab,
│                                 PortalCredentialsTab, PendingOnClientTab, FeedbackModal
├── layout/                     # Sidebar, Header, NotificationBell
└── ui/                         # مكونات عامة: Button, Modal, Table, Tabs, Badge, CustomSelect (Portal-based dropdown)...

hooks/                         # React Query hooks لكل دومين
lib/
├── api.ts                     # عميل axios + كل تعريفات الـ API الداخلي (dashboard) + الأنواع (TypeScript types)
├── portal-api.ts               # عميل axios منفصل + API الخاص ببوابة العميل
├── auth-context.tsx            # Context الخاص بمصادقة الموظفين
├── portal-auth-context.tsx     # Context الخاص بمصادقة العميل
├── config.ts / portal-config.ts # API_BASE + أسماء التوكنات (كوكيز منفصلة)
├── error-bus.ts / error-utils.ts # نظام مركزي لعرض أخطاء الـ API كـ Toast
├── status-badges.ts            # ألوان/تسميات حالات الفواتير والمهام...
└── providers.tsx                # QueryClientProvider wrapper
```

> **ملاحظة**: ميزة "Team" (صفحة `/dashboard/team` + تاب Team داخل المشروع + project members) **اتشالت بالكامل**، وميزة "Timeline / Gantt" (داشبورد وبورتال) **اتشالت بالكامل** كمان — دول قرارات منتج متعمدة، مش نواقص.

---

## 4. المصادقة (Authentication)

يوجد **نظامان منفصلان تمامًا** للمصادقة، لكل منهما axios instance مستقل وكوكي توكن مستقل:

| | لوحة التحكم (Dashboard) | بوابة العميل (Portal) |
|---|---|---|
| Context | `lib/auth-context.tsx` (`useAuth`) | `lib/portal-auth-context.tsx` (`usePortalAuth`) |
| API client | `lib/api.ts` (`api`) | `lib/portal-api.ts` (`portalApi`) |
| اسم كوكي التوكن | `pms_token` (`TOKEN_KEY`) | مُعرّف في `portal-config.ts` (`PORTAL_TOKEN_KEY`) |
| نقطة الدخول | `/login` | `/portal/login` |
| عند 401 | حذف الكوكي + Redirect لـ `/login` | حذف الكوكي + Redirect لـ `/portal/login` |

### دعوة عميل للبوابة (Invite flow)
من صفحة تفاصيل العميل (`PortalAccessCard`)، الموظف بيبعت دعوة (اسم + إيميل). الباك إند بيولّد توكن دعوة وبيبعته أوتوماتيك بالإيميل، **وكمان بيرجعه للفرونت** (`invite_link`) عشان الموظف يقدر ينسخه ويبعته يدويًا (واتساب مثلًا) كخيار احتياطي بجانب الإيميل — الاتنين متاحين مع بعض.

---

## 5. الوحدات الوظيفية — لوحة التحكم

### 5.1 Dashboard الرئيسي (`/dashboard`)
إحصائيات عامة: عدد العملاء، المشاريع، قيمة المشاريع، المدفوعات، المصروفات، توزيع المشاريع حسب الحالة، ملخص مالي، ومتوسط تقييم العملاء الأخير (Feedback).

### 5.2 العملاء (Clients) — `/dashboard/clients`
- CRUD كامل للعملاء + ملخص مدفوعات لكل عميل.
- إدارة **مستخدمي بوابة العميل**: دعوة/سحب صلاحية + نسخ لينك الدعوة يدويًا.

### 5.3 المشاريع (Projects) — `/dashboard/projects`
صفحة تفاصيل المشروع فيها Tabs التالية:
- **Tasks** — Kanban Board كامل (Status/Priority/Subtasks/Checklist/Dependencies)، مع دعم إسناد المهمة **لموظف من الشركة أو للعميل نفسه** (`assignee_type: team_member | client`)، وربط تلقائي بميتنج لو المهمة نتجت من Action Item.
- **Meetings** — جدولة ميتنجات، حضور (موظفين + مستخدمي بوابة)، تدوين محاضر، **Action Items** بتتحول تلقائيًا لمهام (Tasks) مع إشعار المُسنَد إليه (سواء موظف أو عميل)، وتصدير المحضر كملف Word.
- **Links** — روابط المشروع (Staging/Live/Dashboard...) تتعرض للعميل في البورتال.
- **Phases** — مراحل المشروع (تاريخ + مبلغ) — أساس الفوترة واعتماد العميل.
- **Invoices** — فواتير المشروع + إنشاء فاتورة جديدة مباشرة.
- **Credentials** — بيانات دخول المشروع (سيرفر/لوحة تحكم...) مشفّرة (AES-256-GCM)، بإظهار مؤقت للباسورد (auto-hide) وسجل دخول (Access Log).
- **Payments** — عرض مدفوعات المشروع + **زرار "Add payment" لإضافة دفعة مباشرة من جوه صفحة المشروع** (نفس فورم صفحة المدفوعات العامة، مع تحديد المشروع تلقائيًا).
- **Profitability** — (لو متاح) ربحية المشروع: إيراد معترف به/محصّل، تكلفة، هامش ربح.

> **لا يوجد** تاب Team ولا تاب Timeline في صفحة المشروع بعد الآن.

### 5.4 الفواتير، المدفوعات، المصروفات، الموردين
نفس الوظائف السابقة (CRUD + حسابات ضريبية VAT/WHT + تقارير AR/AP Aging) بدون تغيير جوهري.

### 5.5 النظرة المالية العامة (Finance) — `/dashboard/finance`
تقرير مالي شامل (Accrual/Cash basis): إيرادات، مصروفات، هامش ربح إجمالي/تشغيلي/صافي.

### 5.6 الإشعارات (Notifications)
جرس إشعارات في الـ Header (داشبورد وبورتال) — يظهر تنبيهات مثل: تذكير ميتنج قريب، إضافة محضر جديد، إسناد Action Item، اعتماد مرحلة، إلغاء ميتنج، إلخ. يدعم "Mark as read" فردي/جماعي.

---

## 6. بوابة العميل (Client Portal) — `/portal`

- **تسجيل الدخول / قبول الدعوة** عبر لينك مُرسل بالإيميل (أو يدويًا من الموظف).
- **قائمة المشاريع** الخاصة بالعميل (قراءة فقط، مفلترة تلقائيًا من السيرفر).
- **تفاصيل مشروع** بتبويبات:
  - **Phases** — عرض + **اعتماد المرحلة (Approve)**، وبعد الاعتماد بيظهر مباشرة **مودال تقييم مصغّر (1-5 نجوم)**.
  - **Meetings** — عرض الميتنجات، فتح المحاضر (بيسجل "شوهد بتاريخ كذا" أوتوماتيك)، تصدير Word، وأول مرة يفتح فيها محضر بيظهر مودال التقييم كمان.
  - **Links** — روابط المشروع (قراءة فقط).
  - **Credentials** — بيانات الدخول (قراءة + إظهار مؤقت للباسورد فقط، من غير سجل دخول ولا إضافة).
  - **For you** — المهام المُسندة للعميل نفسه (قراءة فقط في هذا الإصدار).
- **الفواتير**: عرض فواتير العميل وتفاصيلها + ملخص مدفوعات.
- جرس إشعارات مستقل خاص بالعميل.

---

## 7. نموذج البيانات (النطاقات الرئيسية)

| الكيان | ملاحظة |
|---|---|
| Client / Project / Phase | أساسيات النظام |
| Task | يدعم `assignee_type` (`team_member`/`client`)، `source` (`manual`/`meeting`)، اعتماديات وSubtasks وChecklist |
| Meeting / MeetingAttendee / MeetingNote / MeetingNoteRead | نظام الميتنجات الكامل |
| ProjectLink | روابط مشتركة بين الداشبورد والبورتال |
| Credential / CredentialAccessLog | بيانات دخول مشفّرة + سجل تدقيق (append-only) |
| Notification | إشعارات موحّدة لموظفين وعملاء البوابة |
| Feedback | تقييم 1-5 على ميتنج أو مرحلة |
| Invoice / Payment / Expense / Vendor / VendorBill | الدورة المالية الكاملة |
| ClientPortalUser | مستخدم بوابة العميل (نظام مصادقة منفصل) |

جميع الكيانات تنتمي إلى `company_id` — النظام مصمم Multi-tenant من ناحية الباك إند.

---

## 8. خريطة الروابط (Routes) الكاملة

### لوحة التحكم
| الرابط | الوصف |
|---|---|
| `/login` | تسجيل دخول الموظف |
| `/dashboard` | إحصائيات عامة |
| `/dashboard/clients`, `/dashboard/clients/[id]` | العملاء + بوابة العميل |
| `/dashboard/projects`, `/dashboard/projects/[id]` | المشاريع (Tasks/Meetings/Links/Phases/Invoices/Credentials/Payments) |
| `/dashboard/invoices`, `/dashboard/invoices/[id]` | الفواتير |
| `/dashboard/invoices/ar-aging` , `/ap-aging` | تقارير أعمار الذمم |
| `/dashboard/payments` | المدفوعات |
| `/dashboard/expenses` | المصروفات |
| `/dashboard/vendors`, `/dashboard/vendors/[id]` | الموردين وفواتيرهم |
| `/dashboard/finance` | النظرة المالية العامة |

### بوابة العميل
| الرابط | الوصف |
|---|---|
| `/portal/login` | تسجيل دخول العميل |
| `/portal/accept-invite` | قبول دعوة الانضمام |
| `/portal` | قائمة مشاريع العميل |
| `/portal/projects/[id]` | Phases / Meetings / Links / Credentials / For you |
| `/portal/invoices`, `/portal/invoices/[id]` | فواتير العميل |

---

## 9. نقاط ملاحظة مهمة

- **لا يوجد اختبارات (tests)** في المشروع حاليًا.
- **لا يوجد state management عام** — الاعتماد كليًا على React Query + Context للمصادقة فقط.
- `CustomSelect` (الدروبداون المخصص المستخدم في كل فورمات النظام) بيتعرض عبر React Portal بموضع `fixed`، فمش بيتقطع جوه الـ Modals حتى لو المودال طويل وفيه Scroll.
- ميزات بوابة العميل (Notifications, Meetings, Project Links, Credentials, Feedback, Task client-assignment) اتبنت بالتنسيق مع مواصفات موجودة في فولدر `CLIENT-PORTAL-FEATURES/` بجذر المشروع، ومطابقة لباك إند فعلي شغال (مش نظري).
- الاتصال بالباك إند عبر متغيّر بيئة واحد: `NEXT_PUBLIC_API_URL`.

---

*تم تحديث هذا الملف تلقائيًا بواسطة Claude Code بناءً على مراجعة فعلية لكود المشروع الحالي.*
