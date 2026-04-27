import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InquiryStatus } from "@/types/api";

export const inquiryStatusStyles: Record<InquiryStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
  sent: {
    label: "Sent",
    className: "border-sky-200 bg-sky-100 text-sky-700",
  },
  accepted: {
    label: "Accepted",
    className: "border-green-200 bg-green-100 text-green-700",
  },
  rejected: {
    label: "Rejected",
    className: "border-rose-200 bg-rose-100 text-rose-700",
  },
  discussion_requested: {
    label: "Discussion Requested",
    className: "border-amber-200 bg-amber-100 text-amber-700",
  },
  expired: {
    label: "Expired",
    className: "border-red-200 bg-red-100 text-red-700",
  },
  invoiced: {
    label: "Invoiced",
    className: "border-violet-200 bg-violet-100 text-violet-700",
  },
  completed: {
    label: "Completed",
    className: "border-emerald-200 bg-emerald-100 text-emerald-700",
  },
  archived: {
    label: "Archived",
    className: "border-slate-300 bg-slate-200 text-slate-600",
  },
};

export function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
  const config = inquiryStatusStyles[status];

  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}