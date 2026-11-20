"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, CalendarDays, KanbanSquare, List, Mail, Plus, Repeat, Search, LayoutTemplate } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FilterDrawer, type FilterChip } from "@/components/ui/FilterDrawer";
import { SavedFilters, setOnly } from "@/components/ui/SavedFilters";
import { ExportButton } from "@/components/ui/ExportButton";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { TasksBoard } from "@/components/tasks/TasksBoard";
import { TasksCalendar, monthBounds } from "@/components/tasks/TasksCalendar";
import { TaskListTable } from "@/components/tasks/TaskListTable";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { useAllTasks, useSetTaskPreferences, useTaskPreferences, useTaskSummary } from "@/hooks/use-tasks";
import { useProjectsShortList } from "@/hooks/use-projects";
import { useUsersShortList } from "@/hooks/use-users";
import { useAuth } from "@/lib/auth-context";
import { can, canSeeAllTasks } from "@/lib/permissions";
import { fetchAllPages } from "@/lib/export";
import { taskColumns } from "@/lib/export-columns";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { tasksApi, type TaskListParams, type TaskPriority } from "@/lib/api";

const OPEN_STATUSES = "todo,in_progress,in_review,blocked";
const PAGE_SIZE_KEY = "tasks.pageSize";

function storedPageSize() {
  try {
    const n = Number(window.localStorage.getItem(PAGE_SIZE_KEY));
    return [20, 50, 100].includes(n) ? n : 20;
  } catch {
    return 20;
  }
}
const INTERNAL = "__internal";

type View = "list" | "board" | "calendar";
type Scope = "mine" | "all";

function Tile({ label, value, tone, onClick, active }: { label: string; value: number; tone?: "danger"; onClick?: () => void; active?: boolean }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      {...(onClick ? { type: "button" as const, onClick } : {})}
      className={`rounded-xl border bg-(--card) px-4 py-3 text-start ${active ? "border-(--primary)" : "border-(--card-border)"} ${onClick ? "transition-colors hover:border-(--primary)" : ""}`}
    >
      <p className="text-xs text-(--muted)">{label}</p>
      <p className={`num mt-0.5 text-2xl font-semibold ${tone === "danger" && value > 0 ? "text-(--destructive)" : "text-(--foreground)"}`}>{value}</p>
    </Comp>
  );
}

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const item = (v: View, label: string, Icon: typeof List) => (
    <button
      type="button"
      onClick={() => onChange(v)}
      aria-pressed={view === v}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${view === v ? "bg-(--card) text-(--foreground) shadow-sm" : "text-(--muted) hover:text-(--foreground)"}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
  return (
    <div className="inline-flex rounded-xl bg-(--muted-bg) p-1">
      {item("list", "List", List)}
      {item("board", "Board", KanbanSquare)}
      {item("calendar", "Calendar", CalendarDays)}
    </div>
  );
}

export default function TasksPage() {
  const { user } = useAuth();
  const seeAll = canSeeAllTasks(user);
  const searchParams = useSearchParams();
  const router = useRouter();

  // A manager's "tasks are overdue" notification links here with ?overdue=1: show everyone's late tasks.
  const fromEscalation = searchParams.get("overdue") === "1";
  // Filters live in the address too, so a filtered list can be bookmarked or sent to a colleague.
  const param = (k: string) => searchParams.get(k) ?? "";
  const [view, setView] = useState<View>(() => (["board", "calendar"].includes(param("view")) ? (param("view") as View) : "list"));
  const [scope, setScope] = useState<Scope>((fromEscalation || param("scope") === "all") && seeAll ? "all" : "mine");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(storedPageSize);
  const [searchText, setSearchText] = useState(param("q"));
  const [q, setQ] = useState(param("q"));
  const [status, setStatusFilter] = useState(param("status") || "open"); // open | all | one status
  const [priority, setPriority] = useState(param("priority"));
  const [projectFilter, setProjectFilter] = useState(param("project")); // "" | INTERNAL | project id
  const [assignee, setAssignee] = useState(param("assignee"));
  const [dueFrom, setDueFrom] = useState(param("from"));
  const [dueTo, setDueTo] = useState(param("to"));
  const [overdueOnly, setOverdueOnly] = useState(fromEscalation);
  const [calMonth, setCalMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [addOnDate, setAddOnDate] = useState<string | null>(null);

  // A notification links here with ?task=ID; that opens the task. Opening one from the list sets detailId.
  const taskFromUrl = searchParams.get("task");
  const [openedId, setDetailId] = useState<string | null>(null);
  const detailId = openedId ?? taskFromUrl;
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (view !== "list") qs.set("view", view);
    if (seeAll && scope === "all") qs.set("scope", "all");
    if (status !== "open") qs.set("status", status);
    if (priority) qs.set("priority", priority);
    if (projectFilter) qs.set("project", projectFilter);
    if (assignee) qs.set("assignee", assignee);
    if (dueFrom) qs.set("from", dueFrom);
    if (dueTo) qs.set("to", dueTo);
    if (overdueOnly) qs.set("overdue", "1");
    if (q) qs.set("q", q);
    if (taskFromUrl) qs.set("task", taskFromUrl);
    const next = qs.toString();
    if (next !== window.location.search.replace(/^\?/, "")) router.replace(next ? `/dashboard/tasks?${next}` : "/dashboard/tasks", { scroll: false });
  }, [view, scope, seeAll, status, priority, projectFilter, assignee, dueFrom, dueTo, overdueOnly, q, taskFromUrl, router]);

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(searchText.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchText]);

  const { data: projectsData } = useProjectsShortList();
  const { data: usersData } = useUsersShortList();
  const projectOptions = projectsData?.projects?.map((p) => ({ value: String(p.id), label: p.title })) ?? [];
  const userOptions = usersData?.users?.map((u) => ({ value: String(u.id), label: u.name })) ?? [];

  // The filters every query below shares (status and paging are added per view).
  const baseParams = useMemo<TaskListParams>(
    () => ({
      scope: seeAll ? scope : undefined,
      priority: (priority || undefined) as TaskPriority | undefined,
      project_id: projectFilter && projectFilter !== INTERNAL ? projectFilter : undefined,
      internal: projectFilter === INTERNAL ? true : undefined,
      assignee_id: seeAll && scope === "all" ? assignee || undefined : undefined,
      due_from: dueFrom || undefined,
      due_to: dueTo || undefined,
      overdue: overdueOnly || undefined,
      q: q || undefined,
    }),
    [seeAll, scope, priority, projectFilter, assignee, dueFrom, dueTo, overdueOnly, q],
  );

  const listStatus = status === "open" ? OPEN_STATUSES : status === "all" ? undefined : status;
  const { data: listData, isLoading: listLoading } = useAllTasks({ ...baseParams, status: listStatus, page, limit: pageSize }, { enabled: view === "list" });
  const { data: boardData, isLoading: boardLoading } = useAllTasks({ ...baseParams, status: OPEN_STATUSES, limit: 200 }, { enabled: view === "board" });
  const { data: doneData } = useAllTasks({ ...baseParams, status: "done", overdue: undefined, sort: "completed", limit: 20 }, { enabled: view === "board" });
  const bounds = monthBounds(calMonth);
  const { data: calData, isLoading: calLoading } = useAllTasks(
    { ...baseParams, status: undefined, overdue: undefined, due_from: bounds.from, due_to: bounds.to, limit: 200 },
    { enabled: view === "calendar" },
  );
  const { data: prefs } = useTaskPreferences();
  const setPrefs = useSetTaskPreferences();
  const todayDate = new Date().toISOString().slice(0, 10);
  const { data: summary } = useTaskSummary(seeAll ? scope : undefined);

  const resetPage = () => setPage(1);
  const activeCount = [status !== "open", priority, projectFilter, assignee, dueFrom, dueTo, overdueOnly].filter(Boolean).length;
  const clearAll = () => {
    setStatusFilter("open");
    setPriority("");
    setProjectFilter("");
    setAssignee("");
    setDueFrom("");
    setDueTo("");
    setOverdueOnly(false);
    resetPage();
  };

  const chips: FilterChip[] = [
    status !== "open" && {
      key: "status",
      label: `Status: ${status === "all" ? "All" : (TASK_STATUSES.find((s) => s.value === status)?.label ?? status)}`,
      onRemove: () => { setStatusFilter("open"); resetPage(); },
    },
    priority && { key: "priority", label: `Priority: ${priority}`, onRemove: () => { setPriority(""); resetPage(); } },
    projectFilter && {
      key: "project",
      label: `Project: ${projectFilter === INTERNAL ? "Internal" : (projectOptions.find((p) => p.value === projectFilter)?.label ?? projectFilter)}`,
      onRemove: () => { setProjectFilter(""); resetPage(); },
    },
    assignee && { key: "assignee", label: `Assignee: ${userOptions.find((u) => u.value === assignee)?.label ?? assignee}`, onRemove: () => { setAssignee(""); resetPage(); } },
    dueFrom && { key: "from", label: `Due from ${dueFrom}`, onRemove: () => { setDueFrom(""); resetPage(); } },
    dueTo && { key: "to", label: `Due until ${dueTo}`, onRemove: () => { setDueTo(""); resetPage(); } },
    overdueOnly && { key: "overdue", label: "Overdue only", onRemove: () => { setOverdueOnly(false); resetPage(); } },
  ].filter(Boolean) as FilterChip[];

  const tasks = listData?.tasks ?? [];
  const total = listData?.total ?? 0;
  const boardTasks = boardData?.tasks ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="mt-1 text-(--muted)">
            {seeAll && scope === "all" ? "Everyone's work, across projects and internal tasks" : "What's on your plate, across projects and internal work"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={prefs?.digest ?? true}
            title="A short e-mail each morning with what is due or overdue"
            loading={setPrefs.isPending}
            onClick={() => setPrefs.mutate(!(prefs?.digest ?? true))}
          >
            <Mail className="me-2 h-4 w-4" />
            Daily email: {(prefs?.digest ?? true) ? "On" : "Off"}
          </Button>
          {can(user, "taskAdmin") && (
            <>
              <Button variant="outline" onClick={() => router.push("/dashboard/tasks/reports")}>
                <BarChart3 className="me-2 h-4 w-4" />
                Reports
              </Button>
              <Button variant="outline" onClick={() => router.push("/dashboard/tasks/templates")}>
                <LayoutTemplate className="me-2 h-4 w-4" />
                Templates
              </Button>
              <Button variant="outline" onClick={() => router.push("/dashboard/tasks/recurring")}>
                <Repeat className="me-2 h-4 w-4" />
                Recurring
              </Button>
            </>
          )}
          <Button onClick={() => setCreating(true)}>
            <Plus className="me-2 h-4 w-4" />
            New task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Tile label="Open" value={summary?.open ?? 0} />
        <Tile label="Overdue" value={summary?.overdue ?? 0} tone="danger" active={overdueOnly} onClick={() => { setOverdueOnly((v) => !v); resetPage(); }} />
        <Tile label="Due today" value={summary?.dueToday ?? 0} />
        <Tile label="Due this week" value={summary?.dueThisWeek ?? 0} />
        <Tile label="Done in the last 7 days" value={summary?.doneLast7Days ?? 0} />
      </div>

      {seeAll && scope === "all" && (summary?.workload?.length ?? 0) > 0 && (
        <Card>
          <CardContent className="py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--muted)">Team workload (open tasks)</p>
            <div className="flex flex-wrap gap-2">
              {summary!.workload.map((w) => (
                <button
                  key={w.user_id ?? "none"}
                  type="button"
                  disabled={!w.user_id}
                  onClick={() => { if (w.user_id) { setAssignee(String(w.user_id)); resetPage(); } }}
                  className="flex items-center gap-2 rounded-full border border-(--card-border) px-3 py-1 text-sm hover:border-(--primary) disabled:cursor-default disabled:hover:border-(--card-border)"
                >
                  <span>{w.name}</span>
                  <span className="num font-semibold">{w.open}</span>
                  {w.overdue > 0 && <span className="num text-xs font-medium text-(--destructive)">{w.overdue} late</span>}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {seeAll && (
                <div className="inline-flex rounded-xl bg-(--muted-bg) p-1">
                  {(["mine", "all"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={scope === s}
                      onClick={() => { setScope(s); setAssignee(""); resetPage(); }}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${scope === s ? "bg-(--card) text-(--foreground) shadow-sm" : "text-(--muted) hover:text-(--foreground)"}`}
                    >
                      {s === "mine" ? "My tasks" : "Everyone"}
                    </button>
                  ))}
                </div>
              )}
              <ViewToggle view={view} onChange={setView} />
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--muted)" />
                <input
                  type="search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search tasks..."
                  aria-label="Search tasks"
                  className="h-9 w-48 rounded-lg border border-(--border) bg-(--card) ps-9 pe-3 text-sm text-(--foreground) outline-none placeholder:text-(--muted) focus:border-(--ring) focus:ring-2 focus:ring-(--ring)/20 sm:w-60"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SavedFilters
                page="tasks"
                current={setOnly({
                  scope: seeAll && scope === "all" ? "all" : "",
                  view: view === "list" ? "" : view,
                  status: status === "open" ? "" : status,
                  priority,
                  project: projectFilter,
                  assignee,
                  due_from: dueFrom,
                  due_to: dueTo,
                  overdue: overdueOnly,
                  q,
                })}
                onApply={(p) => {
                  setScope(seeAll && p.scope === "all" ? "all" : "mine");
                  setView(p.view === "board" || p.view === "calendar" ? p.view : "list");
                  setStatusFilter(String(p.status ?? "open"));
                  setPriority(String(p.priority ?? ""));
                  setProjectFilter(String(p.project ?? ""));
                  setAssignee(String(p.assignee ?? ""));
                  setDueFrom(String(p.due_from ?? ""));
                  setDueTo(String(p.due_to ?? ""));
                  setOverdueOnly(p.overdue === true);
                  setSearchText(String(p.q ?? ""));
                  setQ(String(p.q ?? ""));
                  setPage(1);
                }}
              />
<FilterDrawer activeCount={activeCount} onClear={clearAll} chips={chips}>
                {view === "list" && (
                  <Select
                    label="Status"
                    options={[{ value: "open", label: "Open (not done)" }, { value: "all", label: "All" }, ...TASK_STATUSES.map((s) => ({ value: s.value, label: s.label }))]}
                    value={status}
                    onChange={(e) => { setStatusFilter(e.target.value); resetPage(); }}
                  />
                )}
                <Select
                  label="Priority"
                  options={[{ value: "", label: "Any priority" }, ...TASK_PRIORITIES.map((p) => ({ value: p.value, label: p.label }))]}
                  value={priority}
                  onChange={(e) => { setPriority(e.target.value); resetPage(); }}
                />
                <Select
                  label="Project"
                  options={[{ value: "", label: "All" }, { value: INTERNAL, label: "Internal only" }, ...projectOptions]}
                  value={projectFilter}
                  onChange={(e) => { setProjectFilter(e.target.value); resetPage(); }}
                />
                {seeAll && scope === "all" && (
                  <Select
                    label="Assignee"
                    options={[{ value: "", label: "Anyone" }, ...userOptions]}
                    value={assignee}
                    onChange={(e) => { setAssignee(e.target.value); resetPage(); }}
                  />
                )}
                <Input type="date" label="Due from" value={dueFrom} onChange={(e) => { setDueFrom(e.target.value); resetPage(); }} />
                <Input type="date" label="Due until" value={dueTo} onChange={(e) => { setDueTo(e.target.value); resetPage(); }} />
                <label className="flex items-center gap-2 text-sm text-(--foreground)">
                  <input type="checkbox" checked={overdueOnly} onChange={(e) => { setOverdueOnly(e.target.checked); resetPage(); }} className="h-4 w-4 accent-(--primary)" />
                  Overdue only
                </label>
              </FilterDrawer>
              <ExportButton
                filename="tasks"
                sheet="Tasks"
                columns={taskColumns}
                fetchRows={() =>
                  fetchAllPages((p, limit) =>
                    tasksApi.listAll({ ...baseParams, status: listStatus, page: p, limit }).then((r) => ({ rows: r.data.tasks, total: r.data.total })),
                  )
                }
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {view === "calendar" ? (
            calLoading ? (
              <p className="py-8 text-center text-(--muted)">Loading tasks...</p>
            ) : (
              <>
                <TasksCalendar
                  month={calMonth}
                  onMonthChange={setCalMonth}
                  tasks={calData?.tasks ?? []}
                  today={todayDate}
                  onOpenTask={setDetailId}
                  onAddOnDay={setAddOnDate}
                  onShowDay={(date) => {
                    setDueFrom(date);
                    setDueTo(date);
                    setStatusFilter("all");
                    setView("list");
                    resetPage();
                  }}
                />
                {(calData?.total ?? 0) > (calData?.tasks.length ?? 0) && (
                  <p className="mt-3 text-xs text-(--muted)">Showing the first {calData?.tasks.length} of {calData?.total} tasks this month. Use the filters to narrow it down.</p>
                )}
              </>
            )
          ) : view === "board" ? (
            boardLoading ? (
              <p className="py-8 text-center text-(--muted)">Loading tasks...</p>
            ) : boardTasks.length === 0 && !(doneData?.tasks?.length) ? (
              <p className="py-8 text-center text-(--muted)">No tasks match. Create one with “New task”.</p>
            ) : (
              <>
                <TasksBoard tasks={boardTasks} doneTasks={doneData?.tasks ?? []} onOpenTask={setDetailId} />
                {(boardData?.total ?? 0) > boardTasks.length && (
                  <p className="mt-3 text-xs text-(--muted)">Showing the first {boardTasks.length} of {boardData?.total} open tasks. Use the filters to narrow it down.</p>
                )}
              </>
            )
          ) : (
            <div className="space-y-3">
              <QuickAddTask projectId={projectFilter && projectFilter !== INTERNAL ? projectFilter : undefined} />
              <TaskListTable
                tasks={tasks}
                loading={listLoading}
                total={total}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(n) => {
                  setPageSize(n);
                  setPage(1);
                  try {
                    window.localStorage.setItem(PAGE_SIZE_KEY, String(n));
                  } catch {
                    /* private mode: just not remembered */
                  }
                }}
                onOpen={setDetailId}
                emptyText={activeCount > 0 || q ? "No tasks match these filters." : "No tasks yet. Type one in the box above, or use “New task”."}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <TaskFormModal
        open={creating || !!addOnDate}
        defaultDueDate={addOnDate ?? undefined}
        onClose={() => {
          setCreating(false);
          setAddOnDate(null);
        }}
        onSaved={(t) => setDetailId(String(t.id))}
      />
      <TaskDetailModal
        taskId={detailId}
        onClose={() => {
          setDetailId(null);
          if (taskFromUrl) router.replace("/dashboard/tasks");
        }}
        onOpenTask={setDetailId}
      />
    </div>
  );
}
