import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, MoreHorizontal, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  matched: boolean;
  aiSuggestion?: string;
}

const transactions: Transaction[] = [
  {
    id: "1",
    description: "Stripe Payment - Client XYZ",
    amount: 2500.00,
    type: "income",
    category: "Sales",
    date: "Today",
    matched: true,
  },
  {
    id: "2",
    description: "Adobe Creative Cloud",
    amount: -54.99,
    type: "expense",
    category: "Software",
    date: "Yesterday",
    matched: true,
  },
  {
    id: "3",
    description: "Transfer from AIB",
    amount: 1800.00,
    type: "income",
    category: "Unmatched",
    date: "Sep 5",
    matched: false,
    aiSuggestion: "Likely matches Invoice #1023",
  },
  {
    id: "4",
    description: "WeWork Monthly",
    amount: -350.00,
    type: "expense",
    category: "Office",
    date: "Sep 4",
    matched: true,
  },
  {
    id: "5",
    description: "Amazon Web Services",
    amount: -127.43,
    type: "expense",
    category: "Hosting",
    date: "Sep 3",
    matched: true,
  },
];

export function RecentTransactions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.4 }}
      className="bg-card rounded-xl card-elevated"
    >
      <div className="flex items-center justify-between p-5 border-b border-border">
        <h3 className="text-sm font-semibold">Recent Transactions</h3>
        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          View all
        </button>
      </div>

      <div className="divide-y divide-border">
        {transactions.map((transaction, index) => (
          <motion.div
            key={transaction.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 + index * 0.05 }}
            className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors group"
          >
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              transaction.type === "income" ? "bg-success/10" : "bg-muted"
            )}>
              {transaction.type === "income" ? (
                <ArrowDownLeft className="w-4 h-4 text-success" />
              ) : (
                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{transaction.description}</p>
                {!transaction.matched && (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">
                    Unmatched
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{transaction.category}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{transaction.date}</span>
              </div>
              {transaction.aiSuggestion && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Sparkles className="w-3 h-3 text-ai" />
                  <span className="text-xs text-ai">{transaction.aiSuggestion}</span>
                </div>
              )}
            </div>

            <div className="text-right">
              <p className={cn(
                "text-sm font-semibold",
                transaction.type === "income" ? "text-success" : "text-foreground"
              )}>
                {transaction.type === "income" ? "+" : ""}€{Math.abs(transaction.amount).toLocaleString('en-IE', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-muted transition-all">
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
