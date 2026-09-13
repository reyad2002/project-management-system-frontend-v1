# ملف تنفيذ قاعدة البيانات (Supabase/Postgres) — المرحلة 1

هذا الملف موجَّه لمن سينفّذ التغييرات على قاعدة بيانات Supabase مباشرة (SQL Editor أو migration files). يعتمد على التصميم في [`PMS-PHASE1-DATA-MODEL.md`](./PMS-PHASE1-DATA-MODEL.md) ويحوّله لـ SQL قابل للتنفيذ فعليًا خطوة بخطوة، بالترتيب.

## 0. افتراضات مهمة (تأكد منها قبل التنفيذ)

1. الباك إند الحالي يتصل بـ Supabase عبر **connection string خاص بالسيرفر (service role / direct Postgres connection)** وليس عبر Supabase client SDK من الفرونت إند مباشرة — الفرونت إند بيكلم REST API خاص بالباك إند فقط (`/api/...`)، مش Supabase مباشرة. **لو الافتراض ده غلط ولسه فيه استخدام مباشر لـ Supabase client من مكان تاني، لازم نضيف RLS policies (قسم 7) قبل الإنتاج.**
2. الجداول الحالية المفترضة موجودة بالفعل: `companies`, `users`, `clients`, `projects`, `phases`, `payments`, `expenses` (بأسماء الأعمدة زي ما ظهرت في `lib/api.ts` و`FRONTEND-API-REPORT.md`).
3. المفتاح الأساسي في كل الجداول `uuid` باستخدام `gen_random_uuid()` (يتطلب extension `pgcrypto` أو `uuid-ossp` — Supabase مفعّلها افتراضيًا عادة عبر `pgcrypto`).
4. **نفّذ كل قسم كـ migration منفصلة بالترتيب المذكور**، وخد Backup/Snapshot من Supabase قبل البدء (Database → Backups في لوحة Supabase).

---

## 1. Extensions المطلوبة (تأكيد فقط)

```sql
-- تأكد إنها مفعّلة (Supabase غالبًا مفعّلها بالفعل)
create extension if not exists pgcrypto;
```

---

## 2. Migration 01 — تعديل جدول `expenses`

```sql
-- 01_alter_expenses.sql

alter table expenses
  add column if not exists project_id uuid references projects(id) on delete set null,
  add column if not exists phase_id   uuid references phases(id) on delete set null,
  add column if not exists vendor_id  uuid,  -- FK يُضاف بعد إنشاء جدول vendors في Migration 03
  add column if not exists cost_category varchar(30) not null default 'other';

-- قيد تحقق على القيم المسموحة لـ cost_category
alter table expenses
  add constraint expenses_cost_category_check
  check (cost_category in ('labor','materials','subcontractor','software','travel','marketing','rent','utilities','other'));

create index if not exists idx_expenses_project on expenses(project_id);
create index if not exists idx_expenses_phase on expenses(phase_id);
```

> **ملاحظة**: مفيش أي `NOT NULL` جديد، فالصفوف الحالية تفضل صالحة تلقائيًا (`cost_category` بياخد `'other'` كـ default، والباقي `null`).

---

## 3. Migration 02 — تعديل جدول `payments`

```sql
-- 02_alter_payments.sql

alter table payments
  add column if not exists invoice_id uuid,  -- FK يُضاف بعد إنشاء جدول invoices في Migration 04
  add column if not exists type varchar(20) not null default 'invoice_settlement';

alter table payments
  add constraint payments_type_check
  check (type in ('advance','invoice_settlement'));

create index if not exists idx_payments_invoice on payments(invoice_id);
```

---

## 4. Migration 03 — جداول الموردين (`vendors`, `vendor_bills`, `vendor_payments`)

```sql
-- 03_create_vendors.sql

create table vendors (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references companies(id) on delete cascade,
  name              varchar(150) not null,
  tax_id            varchar(50),
  email             varchar(150),
  phone             varchar(30),
  address           text,
  default_wht_rate  numeric(5,2) not null default 0,
  notes             text,
  created_by        uuid not null references users(id),
  created_at        timestamptz not null default now()
);

create index idx_vendors_company on vendors(company_id);

-- الآن نربط expenses.vendor_id بعد وجود الجدول
alter table expenses
  add constraint expenses_vendor_id_fkey
  foreign key (vendor_id) references vendors(id) on delete set null;

create table vendor_bills (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references companies(id) on delete cascade,
  vendor_id         uuid not null references vendors(id) on delete restrict,
  project_id        uuid references projects(id) on delete set null,

  bill_number       varchar(50),
  bill_date         date not null,
  due_date          date not null,

  subtotal          numeric(14,2) not null check (subtotal >= 0),
  vat_rate          numeric(5,2)  not null default 14.00,
  vat_amount        numeric(14,2) not null default 0,
  wht_rate          numeric(5,2)  not null default 0,
  wht_amount        numeric(14,2) not null default 0,
  total_amount      numeric(14,2) not null,
  paid_amount       numeric(14,2) not null default 0,
  remaining_amount  numeric(14,2) not null,

  status            varchar(20) not null default 'pending'
    check (status in ('pending','partially_paid','paid','overdue','cancelled')),
  cost_category     varchar(30) not null default 'other'
    check (cost_category in ('labor','materials','subcontractor','software','travel','marketing','rent','utilities','other')),

  notes             text,
  created_by        uuid not null references users(id),
  created_at        timestamptz not null default now()
);

create index idx_vendor_bills_company_status on vendor_bills(company_id, status);
create index idx_vendor_bills_vendor on vendor_bills(vendor_id);
create index idx_vendor_bills_project on vendor_bills(project_id);

create table vendor_payments (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references companies(id) on delete cascade,
  vendor_bill_id  uuid not null references vendor_bills(id) on delete cascade,
  amount          numeric(14,2) not null check (amount > 0),
  payment_date    date not null,
  payment_method  varchar(20) not null
    check (payment_method in ('cash','bank_transfer','credit_card','other')),
  notes           text,
  created_by      uuid not null references users(id),
  created_at      timestamptz not null default now()
);

create index idx_vendor_payments_bill on vendor_payments(vendor_bill_id);
```

---

## 5. Migration 04 — جدول `invoices`

```sql
-- 04_create_invoices.sql

create table invoices (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references companies(id) on delete cascade,
  client_id         uuid not null references clients(id) on delete restrict,
  project_id        uuid not null references projects(id) on delete restrict,
  phase_id          uuid references phases(id) on delete set null,

  invoice_number    varchar(30) not null,
  issue_date        date not null,
  due_date          date not null,

  currency          varchar(3) not null default 'EGP',
  subtotal          numeric(14,2) not null check (subtotal >= 0),
  vat_rate          numeric(5,2)  not null default 14.00,
  vat_amount        numeric(14,2) not null default 0,
  wht_rate          numeric(5,2)  not null default 0,
  wht_amount        numeric(14,2) not null default 0,
  total_amount      numeric(14,2) not null,
  paid_amount       numeric(14,2) not null default 0,
  remaining_amount  numeric(14,2) not null,

  status            varchar(20) not null default 'draft'
    check (status in ('draft','sent','partially_paid','paid','overdue','cancelled')),

  retainage_percent numeric(5,2),
  eta_uuid          varchar(100),
  eta_status        varchar(20) check (eta_status in ('not_submitted','submitted','accepted','rejected')),

  notes             text,
  created_by        uuid not null references users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  cancelled_at      timestamptz,

  unique (company_id, invoice_number)
);

create index idx_invoices_company_status on invoices(company_id, status);
create index idx_invoices_project on invoices(project_id);
create index idx_invoices_client on invoices(client_id);
create index idx_invoices_due_date on invoices(due_date) where status not in ('paid','cancelled');

-- الآن نربط payments.invoice_id بعد وجود الجدول
alter table payments
  add constraint payments_invoice_id_fkey
  foreign key (invoice_id) references invoices(id) on delete set null;
```

---

## 6. Migration 05 — دوال وTriggers للحساب التلقائي

الهدف: أي إدراج/تعديل/حذف على `payments` أو `vendor_payments` يحدّث تلقائيًا `paid_amount`, `remaining_amount`, `status` على `invoices`/`vendor_bills` — بدون الاعتماد على منطق تطبيقي فقط (حماية إضافية لو حصل تحديث مباشر على القاعدة).

```sql
-- 05_triggers.sql

-- (أ) دالة توليد رقم فاتورة تسلسلي لكل شركة: INV-YYYY-0001
create sequence if not exists invoice_number_seq;

create or replace function generate_invoice_number(p_company_id uuid)
returns varchar language plpgsql as $$
declare
  v_year text := to_char(now(), 'YYYY');
  v_count int;
begin
  select count(*) + 1 into v_count
  from invoices
  where company_id = p_company_id
    and invoice_number like 'INV-' || v_year || '-%';

  return 'INV-' || v_year || '-' || lpad(v_count::text, 4, '0');
end;
$$;

-- (ب) دالة إعادة حساب حالة/مبالغ الفاتورة
create or replace function recalc_invoice_totals(p_invoice_id uuid)
returns void language plpgsql as $$
declare
  v_total numeric(14,2);
  v_paid numeric(14,2);
  v_due_date date;
begin
  select total_amount, due_date into v_total, v_due_date
  from invoices where id = p_invoice_id;

  select coalesce(sum(amount), 0) into v_paid
  from payments where invoice_id = p_invoice_id;

  update invoices
  set paid_amount = v_paid,
      remaining_amount = v_total - v_paid,
      status = case
        when v_total - v_paid <= 0 then 'paid'
        when v_paid > 0 then 'partially_paid'
        when v_due_date < current_date then 'overdue'
        when status = 'draft' then 'draft'
        else 'sent'
      end,
      updated_at = now()
  where id = p_invoice_id
    and status <> 'cancelled';
end;
$$;

create or replace function trg_payments_after_change()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'DELETE') then
    if old.invoice_id is not null then
      perform recalc_invoice_totals(old.invoice_id);
    end if;
    return old;
  else
    if new.invoice_id is not null then
      perform recalc_invoice_totals(new.invoice_id);
    end if;
    if (tg_op = 'UPDATE') and old.invoice_id is not null and old.invoice_id is distinct from new.invoice_id then
      perform recalc_invoice_totals(old.invoice_id);
    end if;
    return new;
  end if;
end;
$$;

drop trigger if exists payments_after_change on payments;
create trigger payments_after_change
after insert or update or delete on payments
for each row execute function trg_payments_after_change();

-- (ج) نفس المنطق لـ vendor_bills / vendor_payments
create or replace function recalc_vendor_bill_totals(p_bill_id uuid)
returns void language plpgsql as $$
declare
  v_total numeric(14,2);
  v_paid numeric(14,2);
  v_due_date date;
begin
  select total_amount, due_date into v_total, v_due_date
  from vendor_bills where id = p_bill_id;

  select coalesce(sum(amount), 0) into v_paid
  from vendor_payments where vendor_bill_id = p_bill_id;

  update vendor_bills
  set paid_amount = v_paid,
      remaining_amount = v_total - v_paid,
      status = case
        when v_total - v_paid <= 0 then 'paid'
        when v_paid > 0 then 'partially_paid'
        when v_due_date < current_date then 'overdue'
        else 'pending'
      end
  where id = p_bill_id
    and status <> 'cancelled';
end;
$$;

create or replace function trg_vendor_payments_after_change()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'DELETE') then
    perform recalc_vendor_bill_totals(old.vendor_bill_id);
    return old;
  else
    perform recalc_vendor_bill_totals(new.vendor_bill_id);
    return new;
  end if;
end;
$$;

drop trigger if exists vendor_payments_after_change on vendor_payments;
create trigger vendor_payments_after_change
after insert or update or delete on vendor_payments
for each row execute function trg_vendor_payments_after_change();

-- (د) trigger لحساب subtotal/vat/wht/total تلقائيًا عند إدراج/تعديل فاتورة (قبل الحفظ)
create or replace function trg_invoices_before_write()
returns trigger language plpgsql as $$
begin
  new.vat_amount := round(new.subtotal * new.vat_rate / 100, 2);
  new.wht_amount := round(new.subtotal * new.wht_rate / 100, 2);
  new.total_amount := new.subtotal + new.vat_amount - new.wht_amount;
  new.remaining_amount := new.total_amount - coalesce(new.paid_amount, 0);
  new.updated_at := now();

  if new.invoice_number is null then
    new.invoice_number := generate_invoice_number(new.company_id);
  end if;

  return new;
end;
$$;

drop trigger if exists invoices_before_write on invoices;
create trigger invoices_before_write
before insert or update on invoices
for each row execute function trg_invoices_before_write();

-- (هـ) نفس فكرة الحساب التلقائي لـ vendor_bills
create or replace function trg_vendor_bills_before_write()
returns trigger language plpgsql as $$
begin
  new.vat_amount := round(new.subtotal * new.vat_rate / 100, 2);
  new.wht_amount := round(new.subtotal * new.wht_rate / 100, 2);
  new.total_amount := new.subtotal + new.vat_amount - new.wht_amount;
  new.remaining_amount := new.total_amount - coalesce(new.paid_amount, 0);
  return new;
end;
$$;

drop trigger if exists vendor_bills_before_write on vendor_bills;
create trigger vendor_bills_before_write
before insert or update on vendor_bills
for each row execute function trg_vendor_bills_before_write();
```

> **ملاحظة تصميمية**: الاحتساب هنا اتحط في الـ DB (Triggers) عشان يبقى **مضمون ومتسق حتى لو الباك إند فيه باج**. الباك إند برضه ينفّذ نفس المنطق في التطبيق (كما في ملف الباك إند) لأسباب الأداء والتحقق المبكر (validation) قبل الوصول للقاعدة، لكن الـ DB هي مصدر الحقيقة النهائي (source of truth).

---

## 7. Views جاهزة للتقارير (اختياري لكن موصى به)

```sql
-- 06_views.sql

create or replace view v_ar_aging as
select
  i.id, i.company_id, i.invoice_number, i.client_id, c.name as client_name,
  i.due_date, i.remaining_amount,
  greatest((current_date - i.due_date), 0) as days_overdue,
  case
    when current_date <= i.due_date then 'current'
    when current_date - i.due_date between 1 and 30 then '1_30'
    when current_date - i.due_date between 31 and 60 then '31_60'
    when current_date - i.due_date between 61 and 90 then '61_90'
    else 'over_90'
  end as bucket
from invoices i
join clients c on c.id = i.client_id
where i.status not in ('paid','cancelled') and i.remaining_amount > 0;

create or replace view v_ap_aging as
select
  b.id, b.company_id, b.bill_number, b.vendor_id, v.name as vendor_name,
  b.due_date, b.remaining_amount,
  greatest((current_date - b.due_date), 0) as days_overdue,
  case
    when current_date <= b.due_date then 'current'
    when current_date - b.due_date between 1 and 30 then '1_30'
    when current_date - b.due_date between 31 and 60 then '31_60'
    when current_date - b.due_date between 61 and 90 then '61_90'
    else 'over_90'
  end as bucket
from vendor_bills b
join vendors v on v.id = b.vendor_id
where b.status not in ('paid','cancelled') and b.remaining_amount > 0;

create or replace view v_project_profitability as
select
  p.id as project_id, p.company_id, p.title,
  coalesce((select sum(i.subtotal) from invoices i where i.project_id = p.id and i.status <> 'cancelled'), 0) as recognized_revenue,
  coalesce((select sum(e.amount) from expenses e where e.project_id = p.id), 0)
    + coalesce((select sum(vb.subtotal) from vendor_bills vb where vb.project_id = p.id and vb.status <> 'cancelled'), 0) as total_cost
from projects p;
```

`v_project_profitability.gross_profit` يُحسب في طبقة الباك إند بـ `recognized_revenue - total_cost` (أو أضف عمود محسوب لو تفضّل كل الحساب في الـ DB).

---

## 8. RLS (Row Level Security) — قسم احتياطي فقط

**نفّذ هذا القسم فقط لو تأكدت إن فيه استدعاء مباشر لـ Supabase client (anon/authenticated key) من أي مكان غير الباك إند نفسه.** لو الباك إند وحده اللي بيتصل بالـ DB (service role / direct connection)، RLS مش لازم تقنيًا (لكن يُفضّل تفعيلها كطبقة حماية إضافية "defense in depth"):

```sql
alter table invoices enable row level security;
alter table vendors enable row level security;
alter table vendor_bills enable row level security;
alter table vendor_payments enable row level security;

-- مثال policy لو فيه جدول users فيه company_id مرتبط بـ auth.uid()
create policy invoices_isolation on invoices
  for all
  using (company_id = (select company_id from users where id = auth.uid()));
```

> عدّل الشرط حسب الطريقة الفعلية اللي بيتحدد بيها `company_id` للمستخدم الحالي في مشروعكم (الأرجح إنها بتتحدد من الـ JWT الخاص بالباك إند نفسه، فـ RLS بالشكل ده مش هيشتغل إلا لو فيه Supabase Auth حقيقي مستخدم).

---

## 9. ترتيب التنفيذ الكامل (Checklist)

```
[ ] Backup / Snapshot من Supabase
[ ] 01_alter_expenses.sql
[ ] 02_alter_payments.sql
[ ] 03_create_vendors.sql        (يشمل vendors + vendor_bills + vendor_payments + ربط expenses.vendor_id)
[ ] 04_create_invoices.sql       (يشمل ربط payments.invoice_id)
[ ] 05_triggers.sql
[ ] 06_views.sql
[ ] تشغيل استعلام تجريبي: إنشاء invoice تجريبية + payment مرتبطة بيها + التأكد إن paid_amount/status اتحدثوا صح
[ ] (اختياري) قسم RLS لو مطلوب
```

### استعلام تحقق سريع بعد التنفيذ

```sql
-- إنشاء فاتورة تجريبية
insert into invoices (company_id, client_id, project_id, issue_date, due_date, subtotal, created_by)
values ('<company_id>', '<client_id>', '<project_id>', current_date, current_date + 15, 10000, '<user_id>')
returning *;

-- تسجيل دفعة عليها والتأكد من التحديث التلقائي
insert into payments (company_id, project_id, invoice_id, amount, payment_date, payment_method, type, created_by)
values ('<company_id>', '<project_id>', '<invoice_id>', 5000, current_date, 'bank_transfer', 'invoice_settlement', '<user_id>');

select invoice_number, subtotal, vat_amount, total_amount, paid_amount, remaining_amount, status
from invoices where id = '<invoice_id>';
-- المتوقع: paid_amount=5000, status='partially_paid'
```
