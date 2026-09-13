"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { AddMemberForm, type AddMemberFormData } from "@/components/team/AddMemberForm";
import { useProjectMembers, useAddProjectMember, useRemoveProjectMember } from "@/hooks/use-project-members";
import { useUsersShortList } from "@/hooks/use-users";

const FORM_ID = "add-member-form";

interface ProjectTeamTabProps {
  projectId: string;
}

export function ProjectTeamTab({ projectId }: ProjectTeamTabProps) {
  const { data } = useProjectMembers(projectId);
  const { data: usersData } = useUsersShortList();
  const addMember = useAddProjectMember(projectId);
  const removeMember = useRemoveProjectMember(projectId);

  const [modalOpen, setModalOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const members = data?.members ?? [];
  const memberUserIds = new Set(members.map((m) => m.user_id));
  const userOptions =
    usersData?.users?.filter((u) => !memberUserIds.has(u.id)).map((u) => ({ value: u.id, label: u.name })) ?? [];

  const handleSubmit = async (data: AddMemberFormData) => {
    await addMember.mutateAsync({
      user_id: data.user_id,
      role_in_project: data.role_in_project,
      allocation_percent: data.allocation_percent ? Number(data.allocation_percent) : undefined,
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add member
        </Button>
      </div>

      {members.length === 0 ? (
        <p className="py-8 text-center text-(--muted)">No team members assigned yet.</p>
      ) : (
        <Table>
          <TableHead>
            <Th>Name</Th>
            <Th>Role</Th>
            <Th>Allocation</Th>
            <Th align="right">Actions</Th>
          </TableHead>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <Td className="font-medium text-foreground">{m.user_name}</Td>
                <Td className="capitalize text-(--muted)">{m.role_in_project}</Td>
                <Td className="text-(--muted)">{m.allocation_percent != null ? `${m.allocation_percent}%` : "—"}</Td>
                <Td align="right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                    onClick={() => setRemovingId(m.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add team member"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form={FORM_ID} loading={addMember.isPending}>
              Add
            </Button>
          </>
        }
      >
        <AddMemberForm formId={FORM_ID} userOptions={userOptions} onSubmit={handleSubmit} />
      </Modal>

      <ConfirmDialog
        open={!!removingId}
        title="Remove team member?"
        description="They will lose access to this project's tasks and assignments."
        confirmText="Remove"
        isLoading={removeMember.isPending}
        onClose={() => setRemovingId(null)}
        onConfirm={() => {
          if (!removingId) return;
          removeMember.mutate(removingId, { onSuccess: () => setRemovingId(null) });
        }}
      />
    </div>
  );
}
