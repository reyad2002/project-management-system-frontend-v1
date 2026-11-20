"use client";

import { useState } from "react";
import { useProject, useCreateProject, useUpdateProject } from "@/hooks/use-projects";
import { ProjectForm, type ProjectFormData } from "@/components/projects/ProjectForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ClientFormModal } from "@/app/dashboard/clients/ClientFormModal";

const FORM_ID = "project-form";

interface ProjectFormModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string | null;
  clientOptions: { value: string; label: string }[];
  /** New project for this client. */
  defaultClientId?: string;
}

export function ProjectFormModal({ open, onClose, projectId, clientOptions, defaultClientId }: ProjectFormModalProps) {
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [created, setCreated] = useState<{ id: string; name: string } | null>(null);
  const { data: project } = useProject(projectId ?? null);
  const createProject = useCreateProject();
  const updateProject = useUpdateProject(projectId ?? "");

  if (!open) return null;

  const handleSubmit = async (data: ProjectFormData) => {
    const payload = {
      client_id: data.client_id,
      title: data.title,
      details: data.details || undefined,
      start_date: data.start_date || undefined,
      due_date: data.due_date || undefined,
      price: data.price ? Number(data.price) : undefined,
      status: data.status,
      type: data.type,
      billing_model: data.billing_model,
      ad_budget: data.ad_budget ? Number(data.ad_budget) : 0,
      // empty clears the budget
      budget_cost: data.budget_cost === "" || data.budget_cost === undefined ? null : Number(data.budget_cost),
      is_test: data.is_test,
    };
    if (projectId && project) {
      await updateProject.mutateAsync(payload);
    } else {
      await createProject.mutateAsync(payload);
    }
    onClose();
  };

  const isLoading = createProject.isPending || updateProject.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={projectId ? "Edit project" : "New project"}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={isLoading}>
            {projectId ? "Update" : "Create"}
          </Button>
        </>
      }
    >
      <ProjectForm
        project={project ?? undefined}
        // A client made a moment ago may not be in the list yet: add it so the field can show it.
        clientOptions={created && !clientOptions.some((c) => c.value === created.id) ? [...clientOptions, { value: created.id, label: created.name }] : clientOptions}
        formId={FORM_ID}
        onSubmit={handleSubmit}
        defaultClientId={defaultClientId}
        onNewClient={() => setNewClientOpen(true)}
        pickClientId={created?.id ?? null}
      />
      <ClientFormModal open={newClientOpen} onClose={() => setNewClientOpen(false)} clientId={null} onCreated={setCreated} />
    </Modal>
  );
}
