"use client";

import { useProject, useCreateProject, useUpdateProject } from "@/hooks/use-projects";
import { ProjectForm, type ProjectFormData } from "@/components/projects/ProjectForm";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="absolute inset-0" onClick={onClose} onKeyDown={(e) => e.key === "Escape" && onClose()} role="button" tabIndex={0} aria-label="Close" />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          {projectId ? "Edit project" : "New project"}
        </h2>
        <div className="mt-4">
          <ProjectForm
            project={project ?? undefined}
            clientOptions={clientOptions}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
