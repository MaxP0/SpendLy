import { motion } from "framer-motion";
import { Sparkles, AlertCircle, CheckCircle2, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Insight {
  id: string;
  type: "suggestion" | "warning" | "success";
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const initialInsights: Insight[] = [
  {
    id: "1",
    type: "warning",
    message: "3 expenses from last month are still unmatched – want me to review them?",
    action: { label: "Review", onClick: () => {} },
  },
  {
    id: "2",
    type: "suggestion",
    message: "Your VAT return deadline is approaching. Estimated amount: €2,450.",
    action: { label: "Prepare VAT", onClick: () => {} },
  },
  {
    id: "3",
    type: "success",
    message: "All bank transactions from last week have been automatically matched!",
  },
];

export function AIInsightsPanel() {
  const [insights, setInsights] = useState(initialInsights);

  const dismissInsight = (id: string) => {
    setInsights(insights.filter(i => i.id !== id));
  };

  const getIcon = (type: Insight["type"]) => {
    switch (type) {
      case "warning":
        return AlertCircle;
      case "success":
        return CheckCircle2;
      default:
        return Sparkles;
    }
  };

  const getStyles = (type: Insight["type"]) => {
    switch (type) {
      case "warning":
        return {
          bg: "bg-warning/5 border-warning/20",
          icon: "text-warning",
        };
      case "success":
        return {
          bg: "bg-success/5 border-success/20",
          icon: "text-success",
        };
      default:
        return {
          bg: "bg-ai-muted border-ai/20",
          icon: "text-ai",
        };
    }
  };

  if (insights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="bg-card rounded-xl p-5 card-elevated"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-ai flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">AI Insights</h3>
          <p className="text-xs text-muted-foreground">Smart suggestions for your finances</p>
        </div>
      </div>

      <div className="space-y-3">
        {insights.map((insight, index) => {
          const Icon = getIcon(insight.type);
          const styles = getStyles(insight.type);

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "relative flex items-start gap-3 p-3 rounded-lg border transition-all",
                styles.bg
              )}
            >
              <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", styles.icon)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed pr-6">{insight.message}</p>
                {insight.action && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 px-2 text-xs hover:bg-background/50"
                    onClick={insight.action.onClick}
                  >
                    {insight.action.label}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
              <button
                onClick={() => dismissInsight(insight.id)}
                className="absolute top-2 right-2 p-1 rounded hover:bg-background/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
