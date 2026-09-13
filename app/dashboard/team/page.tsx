"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td, TableSkeletonRows } from "@/components/ui/Table";
import { useTeamWorkload } from "@/hooks/use-team";

export default function TeamPage() {
  const { data, isLoading } = useTeamWorkload();
  const members = data?.members ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Team</h1>
        <p className="mt-1 text-(--muted)">Workload across all active projects</p>
      </div>

      <Card>
        <CardContent>
          {isLoading ? (
            <Table>
              <TableHead>
                <Th>Name</Th>
                <Th>Active projects</Th>
                <Th>Allocation</Th>
                <Th>Open tasks</Th>
                <Th align="right">Overdue tasks</Th>
              </TableHead>
              <TableBody>
                <TableSkeletonRows columns={5} />
              </TableBody>
            </Table>
          ) : members.length === 0 ? (
            <p className="py-8 text-center text-(--muted)">No team members found.</p>
          ) : (
            <Table>
              <TableHead>
                <Th>Name</Th>
                <Th>Active projects</Th>
                <Th>Allocation</Th>
                <Th>Open tasks</Th>
                <Th align="right">Overdue tasks</Th>
              </TableHead>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.user_id}>
                    <Td className="font-medium text-foreground">{m.name}</Td>
                    <Td className="text-(--muted)">{m.active_projects_count}</Td>
                    <Td>
                      {m.total_allocation_percent > 100 ? (
                        <Badge variant="danger">{m.total_allocation_percent}%</Badge>
                      ) : (
                        <span className="text-(--muted)">{m.total_allocation_percent}%</span>
                      )}
                    </Td>
                    <Td className="text-(--muted)">{m.open_tasks_count}</Td>
                    <Td align="right">
                      {m.overdue_tasks_count > 0 ? (
                        <Badge variant="danger">{m.overdue_tasks_count}</Badge>
                      ) : (
                        <span className="text-(--muted)">0</span>
                      )}
                    </Td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
