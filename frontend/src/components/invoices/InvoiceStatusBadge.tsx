import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@/types/api";

const invoiceStatusStyles: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-700 border-slate-200" },
  issued: { label: "Issued", className: "bg-sky-100 text-sky-700 border-sky-200" },
  paid: { label: "Paid", className: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "Cancelled", className: "bg-rose-100 text-rose-700 border-rose-200" },
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const config = invoiceStatusStyles[status];

  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}