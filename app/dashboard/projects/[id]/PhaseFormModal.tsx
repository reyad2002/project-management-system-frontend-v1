"use client";

import { usePhase, useCreatePhase, useUpdatePhase } from "@/hooks/use-phases";
import { PhaseForm, type PhaseFormData } from "@/components/phases/PhaseForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

const FORM_ID = "phase-form";

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
    <Modal
      open={open}
      onClose={onClose}
      title={phaseId ? "Edit phase" : "New phase"}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={isLoading}>
            {phaseId ? "Update" : "Create"}
          </Button>
        </>
      }
    >
      <PhaseForm phase={phase ?? undefined} formId={FORM_ID} onSubmit={handleSubmit} />
    </Modal>
  );
}
