"use client";

import { useState } from "react";
import { Plus, MessageSquare, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import {
  useProjectFiles,
  useUploadProjectFile,
  useFileComments,
  useAddFileComment,
} from "@/hooks/use-project-files";
import { FileUploadForm } from "@/components/files/FileUploadForm";
import { FileCommentsModal } from "@/components/files/FileCommentsModal";
import { fileStatusVariant } from "@/lib/status-badges";
import type { ProjectFile } from "@/lib/api";

const UPLOAD_FORM_ID = "file-upload-form";

interface FilesTabProps {
  projectId: string;
}

export function FilesTab({ projectId }: FilesTabProps) {
  const { data, isLoading } = useProjectFiles(projectId);
  const uploadFile = useUploadProjectFile(projectId);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [commentsFile, setCommentsFile] = useState<ProjectFile | null>(null);

  const commentsData = useFileComments(commentsFile?.id ?? null);
  const addComment = useAddFileComment(commentsFile?.id ?? "");

  const files = data?.files ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Plus className="me-2 h-4 w-4" />
          Upload file
        </Button>
      </div>

      {isLoading ? (
        <p className="text-(--muted)">Loading files...</p>
      ) : files.length === 0 ? (
        <p className="text-(--muted)">No files uploaded yet.</p>
      ) : (
        <Table>
          <TableHead>
            <Th>Name</Th>
            <Th>From</Th>
            <Th>Status</Th>
            <Th align="right">Actions</Th>
          </TableHead>
          <TableBody>
            {files.map((f) => (
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
                </Td>
                <Td>{f.uploaded_by_type === "client" ? "Client" : "Team"}</Td>
                <Td>
                  {f.status ? (
                    <Badge variant={fileStatusVariant[f.status]}>{f.status.replace("_", " ")}</Badge>
                  ) : (
                    <span className="text-(--muted)">—</span>
                  )}
                </Td>
                <Td align="right">
                  <Button variant="ghost" size="sm" onClick={() => setCommentsFile(f)}>
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

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
    </div>
  );
}
