"use client";

import { useState } from "react";
import Link from "next/link";
import { useVendors, useDeleteVendor } from "@/hooks/use-vendors";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Table, TableHead, TableBody, TableRow, Th, Td, TableSkeletonRows } from "@/components/ui/Table";
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react";
import { ExportButton } from "@/components/ui/ExportButton";
import { fetchAllPages } from "@/lib/export";
import { vendorColumns } from "@/lib/export-columns";
import { vendorsApi } from "@/lib/api";
import { VendorFormModal } from "./VendorFormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function VendorsPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingVendorId, setDeletingVendorId] = useState<string | null>(null);

  const { data, isLoading } = useVendors({
    page,
    limit: 10,
    q: q || undefined,
  });
  const deleteVendor = useDeleteVendor();

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
          <h1 className="text-2xl font-bold text-foreground">Vendors</h1>
          <p className="mt-1 text-(--muted)">Manage your suppliers and subcontractors</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setModalOpen(true);
          }}
        >
          <Plus className="me-2 h-4 w-4" />
          Add vendor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleSearch} className="flex min-w-48 flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--muted)" />
              <Input
                className="ps-9"
                placeholder="Search by name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>
          <ExportButton
            filename="vendors"
            sheet="Vendors"
            columns={vendorColumns}
            fetchRows={() =>
              fetchAllPages((page, limit) =>
                vendorsApi.list({ page, limit, q: q || undefined }).then((r) => ({ rows: r.data.vendors, total: r.data.pagination.total })),
              )
            }
          />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Table>
              <TableHead>
                <Th>Name</Th>
                <Th>Tax ID</Th>
                <Th>Phone</Th>
                <Th align="right">Actions</Th>
              </TableHead>
              <TableBody>
                <TableSkeletonRows columns={4} />
              </TableBody>
            </Table>
          ) : !data?.vendors?.length ? (
            <EmptyState title="No vendors found" description="Add the companies you pay (hosting, freelancers, suppliers)." action={<Button size="sm" onClick={() => {
                setEditingId(null);
                setModalOpen(true);
              }}><Plus className="me-2 h-4 w-4" />Add vendor</Button>} />
          ) : (
            <>
              <Table>
                <TableHead>
                  <Th>Name</Th>
                  <Th>Tax ID</Th>
                  <Th>Phone</Th>
                  <Th align="right">Actions</Th>
                </TableHead>
                <TableBody>
                  {data.vendors.map((v) => (
                    <TableRow key={v.id}>
                      <Td className="font-medium text-foreground">{v.name}</Td>
                      <Td className="text-(--muted)">{v.tax_id ?? "—"}</Td>
                      <Td className="text-(--muted)">{v.phone ?? "—"}</Td>
                      <Td align="right">
                        <div className="inline-flex items-center gap-1">
                          <Link href={`/dashboard/vendors/${v.id}`}>
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
                              setEditingId(v.id);
                              setModalOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                            onClick={() => setDeletingVendorId(v.id)}
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

      <VendorFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
        }}
        vendorId={editingId}
      />

      <ConfirmDialog
        open={!!deletingVendorId}
        title="Delete vendor?"
        description="This action cannot be undone."
        confirmText="Delete"
        isLoading={deleteVendor.isPending}
        onClose={() => setDeletingVendorId(null)}
        onConfirm={() => {
          if (!deletingVendorId) return;
          deleteVendor.mutate(deletingVendorId, {
            onSuccess: () => setDeletingVendorId(null),
          });
        }}
      />
    </div>
  );
}
