"use client";

import { useProject, useCreateProject, useUpdateProject } from "@/hooks/use-projects";
import { ProjectForm, type ProjectFormData } from "@/components/projects/ProjectForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

const FORM_ID = "project-form";

interface ProjectFormModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string | null;
  clientOptions: { value: string; label: string }[];
}

export function ProjectFormModal({ open, onClose, projectId, clientOptions }: ProjectFormModalProps) {
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
      <ProjectForm project={project ?? undefined} clientOptions={clientOptions} formId={FORM_ID} onSubmit={handleSubmit} />
    </Modal>
  );
}
