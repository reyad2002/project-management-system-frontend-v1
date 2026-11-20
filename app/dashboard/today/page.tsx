"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, CalendarClock, CheckSquare, HandCoins, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToday } from "@/hooks/use-today";
import { GettingStarted } from "@/components/today/GettingStarted";
import { HealthBadge } from "@/components/clients/HealthBadge";
import { useAuth } from "@/lib/auth-context";
import { formatMoney } from "@/components/finance/monthFormat";
import { taskPriorityVariant } from "@/lib/status-badges";
import type { TodayTask } from "@/lib/api";

function Big({ label, value, sub, tone, icon: Icon, href }: { label: string; value: string; sub?: string; tone?: "in" | "out" | "warn"; icon: typeof HandCoins; href?: string }) {
  const color = tone === "in" ? "text-(--success)" : tone === "out" ? "text-(--destructive)" : tone === "warn" ? "text-(--warning)" : "text-(--foreground)";
  const body = (
    <Card className={href ? "transition-colors hover:border-(--primary)" : ""}>
      <CardContent className="flex items-start gap-3 p-4">
        <span className="mt-0.5 rounded-lg bg-(--muted-bg) p-2 text-(--muted)">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-(--muted)">{label}</p>
          <p className={`num mt-0.5 text-2xl font-semibold ${color}`}>{value}</p>
          {sub && <p className="mt-0.5 text-xs text-(--muted)">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-4 text-center text-sm text-(--muted)">{children}</p>;
}

function Row({ title, sub, right, rightTone }: { title: string; sub?: string; right: string; rightTone?: "danger" }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-(--foreground)">{title}</span>
        {sub && <span className="block truncate text-xs text-(--muted)">{sub}</span>}
      </span>
      <span className={`num shrink-0 text-sm font-semibold ${rightTone === "danger" ? "text-(--destructive)" : "text-(--foreground)"}`}>{right}</span>
    </li>
  );
}

function TaskList({ tasks, empty }: { tasks: TodayTask[]; empty: string }) {
  const router = useRouter();
  if (tasks.length === 0) return <Empty>{empty}</Empty>;
  return (
    <ul className="divide-y divide-(--border-subtle)">
      {tasks.map((task) => (
        <li key={task.id}>
          <button type="button" onClick={() => router.push(`/dashboard/tasks?task=${task.id}`)} className="flex w-full items-center justify-between gap-3 py-2.5 text-start">
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-(--foreground)">{task.title}</span>
              <span className="block truncate text-xs text-(--muted)">
                {task.assignee_name ?? "Unassigned"}
                {task.due_date ? ` · ${task.due_date}` : ""}
              </span>
            </span>
            <Badge variant={taskPriorityVariant[task.priority]} dot={false}>
              {task.priority}
            </Badge>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function TodayPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useToday();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-(--primary) border-t-transparent" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-lg border border-(--destructive) bg-red-50 p-4 text-(--destructive)">
        Couldn&apos;t load Today. If you just updated the app, make sure the backend has been deployed too.
      </div>
    );
  }

  const { money, tasks, meetings } = data;
  const dateLabel = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${data.date}T12:00:00Z`));
  const firstName = (user?.name ?? "").split(" ")[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{firstName ? `Today, ${firstName}` : "Today"}</h1>
        <p className="mt-1 text-(--muted)">{dateLabel}</p>
      </div>

      <GettingStarted />

      {money && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Big
              label="Money in today"
              value={formatMoney(money.in.total)}
              sub={`${money.in.count} payments` + (money.in.expectedToday.count > 0 ? ` · ${`${formatMoney(money.in.expectedToday.total)} still due today`}` : "")}
              tone="in"
              icon={ArrowDownLeft}
              href={`/dashboard/payments?from_date=${data.date}&to_date=${data.date}`}
            />
            <Big label="Money out today" value={formatMoney(money.out.total)} sub={`${money.out.count} expenses`} tone="out" icon={ArrowUpRight} href="/dashboard/expenses" />
            <Big
              label="To collect (overdue)"
              value={formatMoney(money.collect.overdueTotal)}
              sub={`${money.collect.overdueCount} invoices`}
              tone={money.collect.overdueCount > 0 ? "warn" : undefined}
              icon={HandCoins}
              href="/dashboard/invoices/ar-aging"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Who to chase today</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {money.collect.items.length === 0 ? (
                  <Empty>Nothing overdue. Nice.</Empty>
                ) : (
                  <>
                    <ul className="divide-y divide-(--border-subtle)">
                      {money.collect.items.map((r) => (
                        <Row key={r.id} title={r.client_name} sub={`${r.invoice_number} · ${`${r.days_overdue} days late`}`} right={formatMoney(r.remaining_amount)} rightTone="danger" />
                      ))}
                    </ul>
                    {money.collect.overdueCount > money.collect.items.length && (
                      <Link href="/dashboard/invoices/ar-aging" className="mt-2 inline-block text-sm font-medium text-(--primary) hover:underline">
                        {`See all ${money.collect.overdueCount}`}
                      </Link>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>To pay</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {money.out.billsDue.count === 0 && money.out.subscriptionsDue.count === 0 ? (
                  <Empty>No bills or subscriptions are due.</Empty>
                ) : (
                  <ul className="divide-y divide-(--border-subtle)">
                    {money.out.billsDue.items.map((b) => (
                      <Row key={`b-${b.id}`} title={b.vendor_name} sub={`${b.bill_number} · ${b.days_overdue > 0 ? `${b.days_overdue} days late` : "due today"}`} right={formatMoney(b.remaining_amount)} rightTone={b.days_overdue > 0 ? "danger" : undefined} />
                    ))}
                    {money.out.subscriptionsDue.items.map((s) => (
                      <Row key={`s-${s.id}`} title={s.name} sub="Subscription · pay manually" right={formatMoney(s.amount)} />
                    ))}
                  </ul>
                )}
                {money.in.renewalsDue.count > 0 && (
                  <p className="mt-3 rounded-lg bg-(--muted-bg) px-3 py-2 text-xs text-(--muted)">
                    {`${money.in.renewalsDue.count} client renewals are due (${formatMoney(money.in.renewalsDue.total)}).`}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {data.attention && (data.attention.clients.length > 0 || data.attention.budgets.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {data.attention.clients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Clients who need attention</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="divide-y divide-(--border-subtle)">
                  {data.attention.clients.map((c) => (
                    <li key={c.client_id}>
                      <Link href={`/dashboard/clients/${c.client_id}`} className="flex items-center justify-between gap-3 py-2.5">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-(--foreground)">{c.name}</span>
                          {c.reason && <span className="block truncate text-xs text-(--muted)">{c.reason}</span>}
                        </span>
                        <HealthBadge level={c.level} score={c.score} />
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard/clients/health" className="mt-2 inline-block text-sm font-medium text-(--primary) hover:underline">
                  All clients
                </Link>
              </CardContent>
            </Card>
          )}
          {data.attention.budgets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Projects near or over budget</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="divide-y divide-(--border-subtle)">
                  {data.attention.budgets.map((b) => (
                    <Row key={b.id} title={b.title} sub={`${formatMoney(b.actual)} of ${formatMoney(b.budget)}`} right={`${b.percent}%`} rightTone={b.level === "over" ? "danger" : undefined} />
                  ))}
                </ul>
                <Link href="/dashboard/finance/budgets" className="mt-2 inline-block text-sm font-medium text-(--primary) hover:underline">
                  All budgets
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tasks && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-(--destructive)" />
                Overdue tasks
                <span className="num text-sm font-normal text-(--muted)">({tasks.overdueCount})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <TaskList tasks={tasks.overdue} empty="No overdue tasks." />
              {tasks.overdueCount > tasks.overdue.length && (
                <Link href="/dashboard/tasks?overdue=1" className="mt-2 inline-block text-sm font-medium text-(--primary) hover:underline">
                  {`See all ${tasks.overdueCount}`}
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Due today
                <span className="num text-sm font-normal text-(--muted)">({tasks.dueTodayCount})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <TaskList tasks={tasks.dueToday} empty="Nothing is due today." />
              {tasks.blockedCount > 0 && <p className="mt-3 rounded-lg bg-(--destructive-bg) px-3 py-2 text-xs text-(--destructive)">{`${tasks.blockedCount} tasks are blocked.`}</p>}
            </CardContent>
          </Card>
        </div>
      )}

      {meetings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Meetings today
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {meetings.length === 0 ? (
              <Empty>No meetings today.</Empty>
            ) : (
              <ul className="divide-y divide-(--border-subtle)">
                {meetings.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                    <Link href={`/dashboard/projects/${m.project_id}`} className="flex min-w-0 items-center gap-3">
                      <span className="num w-12 shrink-0 text-sm font-semibold text-(--foreground)">{m.time}</span>
                      <span className="truncate text-sm text-(--foreground)">{m.title}</span>
                    </Link>
                    {m.meeting_link && (
                      <a href={m.meeting_link} target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center gap-1 text-sm font-medium text-(--primary) hover:underline">
                        <Video className="h-4 w-4" />
                        Join
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
