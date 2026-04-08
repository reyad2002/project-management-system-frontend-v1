"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useProjects, useDeleteProject } from "@/hooks/use-projects";
import { useClientsShortList } from "@/hooks/use-clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react";
import { PROJECT_STATUSES } from "@/lib/constants";
import { ProjectFormModal } from "./ProjectFormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
  }).format(n);
}

export default function ProjectsPage() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [clientId, setClientId] = useState(searchParams.get("client_id") ?? "");
  const [status, setStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(
    null,
  );

  const { data, isLoading } = useProjects({
    page,
    limit: 10,
    q: q || undefined,
    client_id: clientId || undefined,
    status: status || undefined,
  });
  const { data: clientsData } = useClientsShortList();
  const deleteProject = useDeleteProject();

  const clientOptions =
    clientsData?.clients?.map((c) => ({
      value: String(c.id),
      label: c.name,
    })) ?? [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQ(searchInput);
    setPage(1);
  };

  const pagination = data?.pagination;
  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.limit)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="mt-1 text-(--muted)">Manage your projects</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add project
        </Button>
      </div>

      <Card>
        <CardHeader>
          <form
            onSubmit={handleSearch}
            className="flex flex-wrap items-end gap-2"
          >
            <div className="relative flex-1 min-w-50">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--muted)" />
              <Input
                className="pl-9"
                placeholder="Search title or details..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <Select
              label="Client"
              options={[{ value: "", label: "All" }, ...clientOptions]}
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                setPage(1);
              }}
            />
            <Select
              label="Status"
              options={[
                { value: "", label: "All" },
                ...PROJECT_STATUSES.map((s) => ({
                  value: s.value,
                  label: s.label,
                })),
              ]}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            />
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--primary) border-t-transparent" />
            </div>
          ) : !data?.projects?.length ? (
            <p className="py-8 text-center text-(--muted)">
              No projects found.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-(--card-border)">
                <table className="w-full text-sm">
                  <thead className="bg-(--muted-bg)">
                    <tr className="text-left text-(--muted)">
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Price</th>
                      <th className="px-4 py-3 font-medium">Due date</th>
                      <th className="px-4 py-3 font-medium text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.projects.map((p, index) => (
                      <tr
                        key={p.id}
                        className={`border-t border-(--card-border) ${
                          index % 2 === 0 ? "bg-(--card)" : "bg-(--muted-bg)/40"
                        } transition-colors hover:bg-sky-50/40`}
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {p.title}
                        </td>
                        <td className="px-4 py-3 capitalize text-(--muted)">
                          {p.status.replace("_", " ")}
                        </td>
                        <td className="px-4 py-3 text-(--muted)">
                          {p.price != null ? formatMoney(p.price) : "—"}
                        </td>
                        <td className="px-4 py-3 text-(--muted)">
                          {p.due_date ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <Link href={`/dashboard/projects/${p.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-sky-700 hover:bg-sky-50 hover:text-sky-800"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                              onClick={() => {
                                setEditingId(p.id);
                                setModalOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                              onClick={() => setDeletingProjectId(p.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-(--muted)">
                    Page {page} of {totalPages} ({pagination?.total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ProjectFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
        }}
        projectId={editingId}
        clientOptions={clientOptions}
      />

      <ConfirmDialog
        open={!!deletingProjectId}
        title="Delete project?"
        description="This action cannot be undone."
        confirmText="Delete"
        isLoading={deleteProject.isPending}
        onClose={() => setDeletingProjectId(null)}
        onConfirm={() => {
          if (!deletingProjectId) return;
          deleteProject.mutate(deletingProjectId, {
            onSuccess: () => setDeletingProjectId(null),
          });
        }}
      />
    </div>
  );
}
