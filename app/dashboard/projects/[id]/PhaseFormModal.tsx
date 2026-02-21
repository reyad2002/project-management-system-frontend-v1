"use client";

import { usePhase, useCreatePhase, useUpdatePhase } from "@/hooks/use-phases";
import { PhaseForm, type PhaseFormData } from "@/components/phases/PhaseForm";

interface PhaseFormModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  phaseId: string | null;
}

export function PhaseFormModal({
  open,
  onClose,
  projectId,
  phaseId,
}: PhaseFormModalProps) {
  const { data: phase } = usePhase(projectId, phaseId);
  const createPhase = useCreatePhase(projectId);
  const updatePhase = useUpdatePhase(projectId, phaseId ?? "");

  if (!open) return null;

  const handleSubmit = async (data: PhaseFormData) => {
    if (phaseId && phase) {
      await updatePhase.mutateAsync({
        start_date: data.start_date,
        end_date: data.end_date,
        amount: data.amount,
        title: data.title,
        notes: data.notes || undefined,
      });
    } else {
      await createPhase.mutateAsync({
        start_date: data.start_date,
        end_date: data.end_date,
        amount: data.amount,
        title: data.title,
        notes: data.notes,
      });
    }
    onClose();
  };

  const isLoading = createPhase.isPending || updatePhase.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Close"
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-[var(--card-border)] bg-[var(--card)] px-6 py-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {phaseId ? "Edit phase" : "New phase"}
          </h2>
        </div>
        <div className="p-6">
          <PhaseForm
            phase={phase ?? undefined}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
