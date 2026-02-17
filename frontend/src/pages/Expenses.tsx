import { motion } from "framer-motion";
import { Upload, Camera, FileText, Sparkles, Check, X, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Expense {
  id: string;
  description: string;
  vendor: string;
  amount: number;
  category: string;
  date: string;
  status: "matched" | "pending" | "review";
  hasReceipt: boolean;
  aiConfidence?: number;
}

const expenses: Expense[] = [
  { id: "1", description: "Adobe Creative Cloud", vendor: "Adobe Inc", amount: 54.99, category: "Software", date: "Sep 6, 2024", status: "matched", hasReceipt: true },
  { id: "2", description: "Office Supplies", vendor: "Amazon", amount: 127.50, category: "Office", date: "Sep 5, 2024", status: "pending", hasReceipt: false },
  { id: "3", description: "Client Lunch", vendor: "Restaurant XYZ", amount: 85.00, category: "Meals & Entertainment", date: "Sep 4, 2024", status: "review", hasReceipt: true, aiConfidence: 72 },
  { id: "4", description: "Cloud Hosting", vendor: "AWS", amount: 234.56, category: "Hosting", date: "Sep 3, 2024", status: "matched", hasReceipt: true },
  { id: "5", description: "Phone Bill", vendor: "Three Ireland", amount: 45.00, category: "Utilities", date: "Sep 1, 2024", status: "matched", hasReceipt: true },
];

export default function Expenses() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses & Receipts</h1>
          <p className="text-muted-foreground mt-1">Track expenses and upload receipts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Camera className="w-4 h-4" />
            Scan Receipt
          </Button>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
            <Upload className="w-4 h-4" />
            Upload
          </Button>
        </div>
      </motion.div>

      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-accent/50 hover:bg-accent/5 transition-colors cursor-pointer group"
      >
        <div className="w-12 h-12 rounded-xl bg-secondary mx-auto mb-4 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
          <Upload className="w-6 h-6 text-muted-foreground group-hover:text-accent transition-colors" />
        </div>
        <p className="text-sm font-medium mb-1">Drop receipts here or click to upload</p>
        <p className="text-xs text-muted-foreground">PDF, JPG, PNG up to 10MB</p>
      </motion.div>

      {/* Expenses List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl card-elevated"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-sm font-semibold">Recent Expenses</h3>
          <div className="flex gap-2">
            {["All", "Pending", "Review"].map((filter) => (
              <Button
                key={filter}
                variant={filter === "All" ? "secondary" : "ghost"}
                size="sm"
                className="text-xs"
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border">
          {expenses.map((expense, index) => (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors group"
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                expense.hasReceipt ? "bg-success/10" : "bg-warning/10"
              )}>
                <FileText className={cn(
                  "w-4 h-4",
                  expense.hasReceipt ? "text-success" : "text-warning"
                )} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{expense.description}</p>
                  {expense.status === "review" && expense.aiConfidence && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-ai-muted">
                      <Sparkles className="w-3 h-3 text-ai" />
                      <span className="text-xs text-ai font-medium">{expense.aiConfidence}% match</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{expense.vendor}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{expense.category}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{expense.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">
                  €{expense.amount.toLocaleString('en-IE', { minimumFractionDigits: 2 })}
                </span>

                {expense.status === "review" ? (
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded-lg bg-success/10 hover:bg-success/20 text-success transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-lg bg-error/10 hover:bg-error/20 text-error transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    expense.status === "matched" 
                      ? "bg-success/10 text-success border-success/20" 
                      : "bg-warning/10 text-warning border-warning/20"
                  )}>
                    {expense.status === "matched" ? "Matched" : "Pending Receipt"}
                  </Badge>
                )}

                <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-muted transition-all">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
