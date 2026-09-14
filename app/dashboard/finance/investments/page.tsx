"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Wallet, TrendingUp, Percent } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useInvestments, useInvestmentsSummary, useDeleteInvestment } from "@/hooks/use-investments";
import { InvestmentsTable } from "@/components/investments/InvestmentsTable";
import { InvestmentFormModal } from "@/components/investments/InvestmentFormModal";
import { InvestmentDetailModal } from "@/components/investments/InvestmentDetailModal";
import type { Investment } from "@/lib/api";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(n);
}

export default function InvestmentsPage() {
  const { data, isLoading } = useInvestments();
  const { data: summaryData } = useInvestmentsSummary();
  const deleteInvestment = useDeleteInvestment();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [deletingInvestment, setDeletingInvestment] = useState<Investment | null>(null);
  const [openInvestmentId, setOpenInvestmentId] = useState<string | null>(null);

  const returnsById = new Map(summaryData?.investments.map((i) => [String(i.investment_id), i.totalReturns]) ?? []);
  const investments = (data?.investments ?? []).map((inv) => ({
    ...inv,
    total_returns: returnsById.get(String(inv.id)) ?? 0,
  }));
  const totalInvested = summaryData?.totalInvested ?? 0;
  const totalReturns = summaryData?.totalReturns ?? 0;
  const roi = (summaryData?.overallReturnPercent ?? 0).toFixed(1);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/finance">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to finance
        </Button>
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Investments</h1>
          <p className="mt-1 text-(--muted)">Track capital invested and returns received</p>
        </div>
        <Button
          onClick={() => {
            setEditingInvestment(null);
            setModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add investment
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-start justify-between p-5">
            <div>
              <p className="text-sm text-(--muted)">Total invested</p>
              <p className="mt-1 text-xl font-semibold text-(--foreground)">{formatMoney(totalInvested)}</p>
            </div>
            <Wallet className="h-6 w-6 text-(--primary)" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start justify-between p-5">
            <div>
              <p className="text-sm text-(--muted)">Total returns received</p>
              <p className="mt-1 text-xl font-semibold text-(--success)">{formatMoney(totalReturns)}</p>
            </div>
            <TrendingUp className="h-6 w-6 text-(--success)" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start justify-between p-5">
            <div>
              <p className="text-sm text-(--muted)">Approximate ROI</p>
              <p className="mt-1 text-xl font-semibold text-(--primary)">{roi}%</p>
            </div>
            <Percent className="h-6 w-6 text-(--primary)" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          {isLoading ? (
            <p className="text-(--muted)">Loading...</p>
          ) : (
            <InvestmentsTable
              investments={investments}
              onOpen={(inv) => setOpenInvestmentId(inv.id)}
              onEdit={(inv) => {
                setEditingInvestment(inv);
                setModalOpen(true);
              }}
              onDelete={(inv) => setDeletingInvestment(inv)}
            />
          )}
        </CardContent>
      </Card>

      <InvestmentFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingInvestment(null);
        }}
        investment={editingInvestment}
      />

      <InvestmentDetailModal
        open={!!openInvestmentId}
        onClose={() => setOpenInvestmentId(null)}
        investmentId={openInvestmentId}
      />

      <ConfirmDialog
        open={!!deletingInvestment}
        title="Delete this investment?"
        description="This action cannot be undone."
        confirmText="Delete"
        isLoading={deleteInvestment.isPending}
        onClose={() => setDeletingInvestment(null)}
        onConfirm={() => {
          if (!deletingInvestment) return;
          deleteInvestment.mutate(deletingInvestment.id, { onSuccess: () => setDeletingInvestment(null) });
        }}
      />
    </div>
  );
}
