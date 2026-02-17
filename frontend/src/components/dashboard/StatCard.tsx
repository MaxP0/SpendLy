import { motion } from "framer-motion";
import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: {
    value: string;
    trend: "up" | "down";
    label?: string;
  };
  icon: LucideIcon;
  variant?: "default" | "accent" | "success" | "warning" | "vat";
  delay?: number;
}

export function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  variant = "default",
  delay = 0 
}: StatCardProps) {
  const variantStyles = {
    default: {
      iconBg: "bg-secondary",
      iconColor: "text-foreground",
    },
    accent: {
      iconBg: "bg-accent/10",
      iconColor: "text-accent",
    },
    success: {
      iconBg: "bg-success/10",
      iconColor: "text-success",
    },
    warning: {
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
    },
    vat: {
      iconBg: "bg-vat/10",
      iconColor: "text-vat",
    },
  };

  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="bg-card rounded-xl p-5 card-elevated group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", styles.iconBg)}>
          <Icon className={cn("w-5 h-5", styles.iconColor)} />
        </div>
        {change && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            change.trend === "up" ? "bg-success/10 text-success" : "bg-error/10 text-error"
          )}>
            {change.trend === "up" ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {change.value}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay * 0.1 + 0.2, duration: 0.3 }}
          className="text-2xl font-semibold tracking-tight"
        >
          {value}
        </motion.p>
        {change?.label && (
          <p className="text-xs text-muted-foreground mt-1">{change.label}</p>
        )}
      </div>
    </motion.div>
  );
}
