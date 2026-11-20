"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { useInvestment, useInvestmentReturns } from "@/hooks/use-investments";
import { AddReturnModal } from "@/components/investments/AddReturnModal";
import { investmentStatusVariant } from "@/lib/status-badges";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(n);
}

interface InvestmentDetailModalProps {
  open: boolean;
  onClose: () => void;
  investmentId: string | null;
}

export function InvestmentDetailModal({ open, onClose, investmentId }: InvestmentDetailModalProps) {
  const { data: investment, isLoading } = useInvestment(open ? investmentId : null);
  const { data: returnsData } = useInvestmentReturns(open ? investmentId : null);
  const [addReturnOpen, setAddReturnOpen] = useState(false);

  if (!open || !investmentId) return null;

  const returns = returnsData?.returns ?? [];
  const totalReturns = returns.reduce((sum, r) => sum + Number(r.amount ?? 0), 0);
  const roi =
    investment && investment.amount_invested > 0 ? ((totalReturns / investment.amount_invested) * 100).toFixed(1) : "0.0";

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={investment?.name ?? "Investment"}
        size="lg"
        footer={<Button variant="outline" onClick={onClose}>Close</Button>}
      >
        {isLoading || !investment ? (
          <p className="text-(--muted)">Loading...</p>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <p className="text-xs text-(--muted)">Status</p>
                <Badge variant={investmentStatusVariant[investment.status]}>{investment.status}</Badge>
              </div>
              <div>
                <p className="text-xs text-(--muted)">Invested</p>
                <p className="font-semibold text-(--foreground)">{formatMoney(investment.amount_invested)}</p>
              </div>
              <div>
                <p className="text-xs text-(--muted)">Total returns</p>
                <p className="font-semibold text-(--success)">{formatMoney(totalReturns)}</p>
              </div>
              <div>
                <p className="text-xs text-(--muted)">ROI</p>
                <p className="font-semibold text-(--primary)">{roi}%</p>
              </div>
            </div>

            {investment.notes && <p className="text-sm text-(--muted)">{investment.notes}</p>}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-(--foreground)">Returns received</p>
                <Button size="sm" onClick={() => setAddReturnOpen(true)}>
                  <Plus className="me-2 h-4 w-4" />
                  Add return
                </Button>
              </div>
              {returns.length === 0 ? (
                <p className="text-sm text-(--muted)">No returns recorded yet.</p>
              ) : (
                <Table>
                  <TableHead>
                    <Th>Date</Th>
                    <Th>Amount</Th>
                  </TableHead>
                  <TableBody>
                    {returns.map((r) => (
                      <TableRow key={r.id}>
                        <Td>{r.received_date}</Td>
                        <Td className="font-medium text-(--success)">{formatMoney(r.amount)}</Td>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}
      </Modal>

      <AddReturnModal open={addReturnOpen} onClose={() => setAddReturnOpen(false)} investmentId={investmentId} />
    </>
  );
}
