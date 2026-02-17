import { motion } from "framer-motion";
import { Plus, Upload, FileText, Receipt, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  { icon: Plus, label: "New Invoice", color: "bg-accent text-accent-foreground" },
  { icon: Upload, label: "Upload Receipt", color: "bg-secondary text-foreground" },
  { icon: FileText, label: "Create Quote", color: "bg-secondary text-foreground" },
  { icon: Send, label: "Record Payment", color: "bg-secondary text-foreground" },
];

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="flex gap-2 flex-wrap"
    >
      {actions.map((action, index) => (
        <motion.button
          key={action.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 + index * 0.05 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-shadow",
            action.color,
            "hover:shadow-md"
          )}
        >
          <action.icon className="w-4 h-4" />
          {action.label}
        </motion.button>
      ))}
    </motion.div>
  );
}
