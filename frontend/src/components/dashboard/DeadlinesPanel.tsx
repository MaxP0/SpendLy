import { motion } from "framer-motion";
import { Calendar, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Deadline {
  id: string;
  title: string;
  date: string;
  status: "upcoming" | "soon" | "overdue" | "completed";
  type: "vat" | "income" | "preliminary";
}

const deadlines: Deadline[] = [
  {
    id: "1",
    title: "VAT Return (Jul-Aug)",
    date: "Sep 19, 2024",
    status: "soon",
    type: "vat",
  },
  {
    id: "2",
    title: "Preliminary Tax Payment",
    date: "Oct 31, 2024",
    status: "upcoming",
    type: "preliminary",
  },
  {
    id: "3",
    title: "Income Tax Return 2023",
    date: "Nov 14, 2024",
    status: "upcoming",
    type: "income",
  },
  {
    id: "4",
    title: "VAT Return (May-Jun)",
    date: "Jul 23, 2024",
    status: "completed",
    type: "vat",
  },
];

const statusConfig = {
  upcoming: {
    color: "text-muted-foreground",
    bg: "bg-muted/50",
    icon: Calendar,
    label: "Upcoming",
  },
  soon: {
    color: "text-warning",
    bg: "bg-warning/10",
    icon: Clock,
    label: "Due Soon",
  },
  overdue: {
    color: "text-error",
    bg: "bg-error/10",
    icon: AlertTriangle,
    label: "Overdue",
  },
  completed: {
    color: "text-success",
    bg: "bg-success/10",
    icon: CheckCircle,
    label: "Completed",
  },
};

export function DeadlinesPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4 }}
      className="bg-card rounded-xl p-5 card-elevated"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Upcoming Deadlines</h3>
        </div>
        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          View all
        </button>
      </div>

      <div className="space-y-3">
        {deadlines.map((deadline, index) => {
          const config = statusConfig[deadline.status];
          const Icon = config.icon;

          return (
            <motion.div
              key={deadline.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-muted/30",
                deadline.status === "completed" && "opacity-60"
              )}
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.bg)}>
                <Icon className={cn("w-4 h-4", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate",
                  deadline.status === "completed" && "line-through"
                )}>
                  {deadline.title}
                </p>
                <p className="text-xs text-muted-foreground">{deadline.date}</p>
              </div>
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                config.bg,
                config.color
              )}>
                {config.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
