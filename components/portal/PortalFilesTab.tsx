"use client";

import { useState } from "react";
import { Plus, MessageSquare, Download, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import {
  usePortalFiles,
  useUploadPortalFile,
  useUpdatePortalFileStatus,
  usePortalFileComments,
  useAddPortalFileComment,
} from "@/hooks/use-portal";
import { FileUploadForm } from "@/components/files/FileUploadForm";
import { FileCommentsModal } from "@/components/files/FileCommentsModal";
import { RequestFileChangesModal } from "@/components/portal/RequestFileChangesModal";
import { fileStatusVariant } from "@/lib/status-badges";
import type { ProjectFile } from "@/lib/api";

const UPLOAD_FORM_ID = "portal-file-upload-form";

interface PortalFilesTabProps {
  projectId: string;
}

export function PortalFilesTab({ projectId }: PortalFilesTabProps) {
  const { data: deliverablesData, isLoading: loadingDeliverables } = usePortalFiles(projectId, {
    category: "deliverable",
  });
  const { data: uploadsData, isLoading: loadingUploads } = usePortalFiles(projectId, { category: "client_upload" });
  const uploadFile = useUploadPortalFile(projectId);
  const updateStatus = useUpdatePortalFileStatus(projectId);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [commentsFile, setCommentsFile] = useState<ProjectFile | null>(null);
  const [changesFile, setChangesFile] = useState<ProjectFile | null>(null);

  const commentsData = usePortalFileComments(commentsFile?.id ?? null);
  const addComment = useAddPortalFileComment(commentsFile?.id ?? "");

  const deliverables = deliverablesData?.files ?? [];
  const uploads = uploadsData?.files ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-(--foreground)">Deliverables from the team</h3>
        {loadingDeliverables ? (
          <p className="text-(--muted)">Loading...</p>
        ) : deliverables.length === 0 ? (
          <p className="text-(--muted)">Nothing shared yet.</p>
        ) : (
          <Table>
            <TableHead>
              <Th>Name</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </TableHead>
            <TableBody>
              {deliverables.map((f) => (
                <TableRow key={f.id}>
                  <Td>
                    <a
                      href={f.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 font-medium text-(--foreground) hover:text-(--primary)"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {f.file_name}
                    </a>
                    {f.description && <p className="text-xs text-(--muted)">{f.description}</p>}
                    {f.status === "needs_changes" && (
                      <p className="mt-1 text-xs text-(--destructive)">See comments for what needs to change.</p>
                    )}
                  </Td>
                  <Td>
                    {f.status ? (
                      <Badge variant={fileStatusVariant[f.status]}>{f.status.replace("_", " ")}</Badge>
                    ) : (
                      <span className="text-(--muted)">—</span>
                    )}
                  </Td>
                  <Td align="right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setCommentsFile(f)}>
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      {f.status === "pending_review" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-(--success)"
                            loading={updateStatus.isPending}
                            onClick={() => updateStatus.mutate({ id: f.id, status: "approved" })}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-(--destructive)"
                            onClick={() => setChangesFile(f)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </Td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-(--foreground)">Your uploads</h3>
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Upload file
          </Button>
        </div>
        {loadingUploads ? (
          <p className="text-(--muted)">Loading...</p>
        ) : uploads.length === 0 ? (
          <p className="text-(--muted)">You haven&apos;t uploaded anything yet.</p>
        ) : (
          <ul className="space-y-2">
            {uploads.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-2 rounded-lg bg-(--muted-bg) px-3 py-2 text-sm">
                <a
                  href={f.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-medium text-(--foreground) hover:text-(--primary)"
                >
                  <Download className="h-3.5 w-3.5" />
                  {f.file_name}
                </a>
                <span className="text-xs text-(--muted)">{new Date(f.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload file"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form={UPLOAD_FORM_ID} loading={uploadFile.isPending}>
              Upload
            </Button>
          </>
        }
      >
        <FileUploadForm
          formId={UPLOAD_FORM_ID}
          onSubmit={async (data) => {
            await uploadFile.mutateAsync(data);
            setUploadOpen(false);
          }}
        />
      </Modal>

      <FileCommentsModal
        open={!!commentsFile}
        onClose={() => setCommentsFile(null)}
        fileName={commentsFile?.file_name ?? ""}
        comments={commentsData.data?.comments ?? []}
        isAdding={addComment.isPending}
        onAddComment={async (content) => {
          await addComment.mutateAsync(content);
        }}
      />

      <RequestFileChangesModal
        open={!!changesFile}
        onClose={() => setChangesFile(null)}
        fileName={changesFile?.file_name ?? ""}
        isSubmitting={updateStatus.isPending}
        onSubmit={async (reviewNote) => {
          if (!changesFile) return;
          await updateStatus.mutateAsync({ id: changesFile.id, status: "needs_changes", comment: reviewNote });
          setChangesFile(null);
        }}
      />
    </div>
  );
}
