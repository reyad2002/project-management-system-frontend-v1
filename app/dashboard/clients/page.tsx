"use client";

import { useState } from "react";
import Link from "next/link";
import { useClients, useDeleteClient } from "@/hooks/use-clients";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react";
import { ClientFormModal } from "./ClientFormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function ClientsPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  const { data, isLoading } = useClients({
    page,
    limit: 10,
    q: q || undefined,
  });
  const deleteClient = useDeleteClient();

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
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="mt-1 text-(--muted)">Manage your clients</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add client
        </Button>
      </div>

      <Card>
        <CardHeader>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--muted)" />
              <Input
                className="pl-9"
                placeholder="Search by name or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
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
          ) : !data?.clients?.length ? (
            <p className="py-8 text-center text-(--muted)">No clients found.</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-(--card-border)">
                <table className="w-full text-sm">
                  <thead className="bg-(--muted-bg)">
                    <tr className="text-left text-(--muted)">
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Phone</th>
                      <th className="px-4 py-3 font-medium text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.clients.map((c, index) => (
                      <tr
                        key={c.id}
                        className={`border-t border-(--card-border) ${
                          index % 2 === 0 ? "bg-(--card)" : "bg-(--muted-bg)/40"
                        } transition-colors hover:bg-sky-50/40`}
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {c.name}
                        </td>
                        <td className="px-4 py-3 text-(--muted)">
                          {c.email ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-(--muted)">
                          {c.phone ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <Link href={`/dashboard/clients/${c.id}`}>
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
                                setEditingId(c.id);
                                setModalOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                              onClick={() => setDeletingClientId(c.id)}
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

      <ClientFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
        }}
        clientId={editingId}
      />

      <ConfirmDialog
        open={!!deletingClientId}
        title="Delete client?"
        description="This action cannot be undone."
        confirmText="Delete"
        isLoading={deleteClient.isPending}
        onClose={() => setDeletingClientId(null)}
        onConfirm={() => {
          if (!deletingClientId) return;
          deleteClient.mutate(deletingClientId, {
            onSuccess: () => setDeletingClientId(null),
          });
        }}
      />
    </div>
  );
}
