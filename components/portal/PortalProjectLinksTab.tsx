"use client";

import { ExternalLink, Globe, LayoutDashboard, Rocket } from "lucide-react";
import { usePortalProjectLinks } from "@/hooks/use-portal";
import type { ProjectLinkType } from "@/lib/api";

const linkIcons: Record<ProjectLinkType, React.ComponentType<{ className?: string }>> = {
  staging: Rocket,
  live: Globe,
  dashboard: LayoutDashboard,
  other: ExternalLink,
};

interface PortalProjectLinksTabProps {
  projectId: string;
}

export function PortalProjectLinksTab({ projectId }: PortalProjectLinksTabProps) {
  const { data, isLoading } = usePortalProjectLinks(projectId);
  const links = data?.links ?? [];

  if (isLoading) return <p className="text-(--muted)">Loading links...</p>;
  if (links.length === 0) return <p className="text-(--muted)">No links shared yet.</p>;

  return (
    <ul className="space-y-2">
      {links.map((link) => {
        const Icon = linkIcons[link.type];
        return (
          <li key={link.id} className="rounded-lg bg-(--muted-bg) px-3 py-2 text-sm">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 items-center gap-2 text-(--foreground) hover:text-(--primary)"
            >
              <Icon className="h-4 w-4 shrink-0 text-(--muted)" />
              <span className="truncate font-medium">{link.label}</span>
              <span className="truncate text-(--muted)">{link.url}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
