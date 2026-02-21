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

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
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
    clientsData?.clients?.map((c) => ({ value: String(c.id), label: c.name })) ?? [];

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
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Projects
          </h1>
          <p className="mt-1 text-[var(--muted)]">Manage your projects</p>
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
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
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
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
            </div>
          ) : !data?.projects?.length ? (
            <p className="py-8 text-center text-[var(--muted)]">
              No projects found.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
                      <th className="pb-3 font-medium">Title</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Price</th>
                      <th className="pb-3 font-medium">Due date</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.projects.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-[var(--border)] last:border-0"
                      >
                        <td className="py-3 font-medium">{p.title}</td>
                        <td className="py-3 capitalize">
                          {p.status.replace("_", " ")}
                        </td>
                        <td className="py-3">
                          {p.price != null ? formatMoney(p.price) : "—"}
                        </td>
                        <td className="py-3">{p.due_date ?? "—"}</td>
                        <td className="py-3 text-right">
                          <Link href={`/dashboard/projects/${p.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
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
                            onClick={() => {
                              if (confirm("Delete this project?"))
                                deleteProject.mutate(p.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-[var(--destructive)]" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-[var(--muted)]">
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
    </div>
  );
}
