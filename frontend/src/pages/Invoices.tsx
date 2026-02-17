import { motion } from "framer-motion";
import { Plus, Search, Filter, MoreHorizontal, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Invoice {
  id: string;
  number: string;
  client: string;
  amount: number;
  status: "paid" | "pending" | "overdue" | "draft";
  date: string;
  dueDate: string;
  isVat: boolean;
}

const invoices: Invoice[] = [
  { id: "1", number: "INV-2024-089", client: "Tech Solutions Ltd", amount: 4500.00, status: "paid", date: "Sep 5, 2024", dueDate: "Sep 20, 2024", isVat: true },
  { id: "2", number: "INV-2024-088", client: "Creative Agency", amount: 2800.00, status: "pending", date: "Sep 3, 2024", dueDate: "Sep 18, 2024", isVat: true },
  { id: "3", number: "INV-2024-087", client: "Startup Inc", amount: 1200.00, status: "overdue", date: "Aug 15, 2024", dueDate: "Aug 30, 2024", isVat: false },
  { id: "4", number: "INV-2024-086", client: "Global Corp", amount: 8750.00, status: "paid", date: "Aug 10, 2024", dueDate: "Aug 25, 2024", isVat: true },
  { id: "5", number: "INV-2024-085", client: "Local Business", amount: 650.00, status: "draft", date: "Sep 7, 2024", dueDate: "-", isVat: false },
];

const statusConfig = {
  paid: { label: "Paid", icon: CheckCircle, class: "bg-success/10 text-success border-success/20" },
  pending: { label: "Pending", icon: Clock, class: "bg-warning/10 text-warning border-warning/20" },
  overdue: { label: "Overdue", icon: AlertCircle, class: "bg-error/10 text-error border-error/20" },
  draft: { label: "Draft", icon: FileText, class: "bg-muted text-muted-foreground border-border" },
};

export default function Invoices() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage and track all your invoices</p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
          <Plus className="w-4 h-4" />
          New Invoice
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search invoices..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          {["All", "Paid", "Pending", "Overdue"].map((filter) => (
            <Button
              key={filter}
              variant={filter === "All" ? "secondary" : "ghost"}
              size="sm"
            >
              {filter}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl card-elevated overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Invoice</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Client</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Amount</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Date</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Due Date</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((invoice, index) => {
                const config = statusConfig[invoice.status];
                const Icon = config.icon;
                
                return (
                  <motion.tr
                    key={invoice.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{invoice.number}</span>
                        {invoice.isVat && (
                          <Badge variant="outline" className="bg-vat/10 text-vat border-vat/20 text-xs">
                            VAT
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm">{invoice.client}</td>
                    <td className="px-5 py-4 text-sm font-medium">
                      €{invoice.amount.toLocaleString('en-IE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="outline" className={cn("gap-1", config.class)}>
                        <Icon className="w-3 h-3" />
                        {config.label}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{invoice.date}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{invoice.dueDate}</td>
                    <td className="px-5 py-4 text-right">
                      <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-muted transition-all">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
