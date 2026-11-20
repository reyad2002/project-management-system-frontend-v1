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
import { Badge } from "@/components/ui/Badge";
import { FilterDrawer, type FilterChip } from "@/components/ui/FilterDrawer";
import { ExportButton } from "@/components/ui/ExportButton";
import { fetchAllPages } from "@/lib/export";
import { projectColumns } from "@/lib/export-columns";
import { projectsApi } from "@/lib/api";
import { Table, TableHead, TableBody, TableRow, Th, Td, TableSkeletonRows } from "@/components/ui/Table";
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react";
import { PROJECT_STATUSES, PROJECT_TYPES } from "@/lib/constants";
import { projectStatusVariant } from "@/lib/status-badges";
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
  const [type, setType] = useState("");
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
    type: type || undefined,
  });
  const { data: clientsData } = useClientsShortList();
  const deleteProject = useDeleteProject();

  const clientOptions =
    clientsData?.clients?.map((c) => ({
      value: String(c.id),
      label: c.name,
    })) ?? [];

  const chips: FilterChip[] = [
    clientId && {
      key: "client",
      label: `Client: ${clientOptions.find((c) => c.value === clientId)?.label ?? clientId}`,
      onRemove: () => {
        setClientId("");
        setPage(1);
      },
    },
    status && {
      key: "status",
      label: `Status: ${PROJECT_STATUSES.find((s) => s.value === status)?.label ?? status}`,
      onRemove: () => {
        setStatus("");
        setPage(1);
      },
    },
    type && {
      key: "type",
      label: `Type: ${PROJECT_TYPES.find((t) => t.value === type)?.label ?? type}`,
      onRemove: () => {
        setType("");
        setPage(1);
      },
    },
  ].filter(Boolean) as FilterChip[];

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
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={handleSearch} className="flex min-w-48 flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--muted)" />
                <Input
                  className="pl-9"
                  placeholder="Search title or details..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>
            <FilterDrawer
              activeCount={[clientId, status, type].filter(Boolean).length}
              onClear={() => {
                setClientId("");
                setStatus("");
                setType("");
                setPage(1);
              }}
              chips={chips}
            >
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
                options={[{ value: "", label: "All" }, ...PROJECT_STATUSES.map((s) => ({ value: s.value, label: s.label }))]}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              />
              <Select
                label="Type"
                options={[{ value: "", label: "All" }, ...PROJECT_TYPES.map((t) => ({ value: t.value, label: t.label }))]}
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setPage(1);
                }}
              />
            </FilterDrawer>
            <ExportButton
              filename="projects"
              sheet="Projects"
              columns={projectColumns((id) => clientOptions.find((c) => c.value === String(id))?.label ?? "")}
              fetchRows={() =>
                fetchAllPages((page, limit) =>
                  projectsApi
                    .list({ page, limit, q: q || undefined, client_id: clientId || undefined, status: status || undefined, type: type || undefined })
                    .then((r) => ({ rows: r.data.projects, total: r.data.pagination.total })),
                )
              }
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Table>
              <TableHead>
                <Th>Title</Th>
                <Th>Type</Th>
                <Th>Status</Th>
                <Th>Price</Th>
                <Th>Due date</Th>
                <Th align="right">Actions</Th>
              </TableHead>
              <TableBody>
                <TableSkeletonRows columns={6} />
              </TableBody>
            </Table>
          ) : !data?.projects?.length ? (
            <p className="py-8 text-center text-(--muted)">
              No projects found.
            </p>
          ) : (
            <>
              <Table>
                <TableHead>
                  <Th>Title</Th>
                  <Th>Type</Th>
                  <Th>Status</Th>
                  <Th>Price</Th>
                  <Th>Due date</Th>
                  <Th align="right">Actions</Th>
                </TableHead>
                <TableBody>
                  {data.projects.map((p) => (
                    <TableRow key={p.id}>
                      <Td className="font-medium text-foreground">
                        {p.title}
                        {p.is_test && (
                          <Badge variant="warning" dot={false} className="ml-2">
                            Test
                          </Badge>
                        )}
                      </Td>
                      <Td className="text-(--muted)">
                        {PROJECT_TYPES.find((t) => t.value === p.type)?.label ?? p.type}
                        {p.billing_model === "retainer" && " · Retainer"}
                        {p.billing_model === "hybrid" && " · Hybrid"}
                      </Td>
                      <Td>
                        <Badge variant={projectStatusVariant[p.status]}>{p.status.replace("_", " ")}</Badge>
                      </Td>
                      <Td className="text-(--muted)">{p.price != null ? formatMoney(p.price) : "—"}</Td>
                      <Td className="text-(--muted)">{p.due_date ?? "—"}</Td>
                      <Td align="right">
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
                      </Td>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
