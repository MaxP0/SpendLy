import { motion } from "framer-motion";
import { ShieldCheck, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaxConfidenceProps {
  score: number; // 0-100
  label: string;
  issues?: string[];
}

export function TaxConfidenceIndicator({ score, label, issues = [] }: TaxConfidenceProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-error";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-success";
    if (score >= 60) return "bg-warning";
    return "bg-error";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Great";
    if (score >= 70) return "Good";
    if (score >= 60) return "Fair";
    return "Needs Work";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="bg-card rounded-xl p-5 card-elevated"
    >
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold">Tax Confidence</h3>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="3"
            />
            <motion.path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className={getScoreColor(score)}
              initial={{ strokeDasharray: "0, 100" }}
              animate={{ strokeDasharray: `${score}, 100` }}
              transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className={cn("text-lg font-bold", getScoreColor(score))}
            >
              {score}%
            </motion.span>
          </div>
        </div>

        <div>
          <p className={cn("text-lg font-semibold", getScoreColor(score))}>
            {getScoreLabel(score)}
          </p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>

      {/* Progress breakdown */}
      <div className="space-y-3">
        <ProgressItem label="Income Recorded" value={95} />
        <ProgressItem label="Expenses Matched" value={78} />
        <ProgressItem label="Receipts Uploaded" value={82} />
        <ProgressItem label="VAT Reconciled" value={100} />
      </div>

      {issues.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-warning/5 border border-warning/20">
          <div className="flex items-center gap-2 text-warning text-sm font-medium mb-2">
            <Info className="w-4 h-4" />
            {issues.length} item{issues.length > 1 ? 's' : ''} need attention
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            {issues.map((issue, i) => (
              <li key={i}>• {issue}</li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

function ProgressItem({ label, value }: { label: string; value: number }) {
  const getColor = (v: number) => {
    if (v >= 90) return "bg-success";
    if (v >= 70) return "bg-accent";
    if (v >= 50) return "bg-warning";
    return "bg-error";
  };

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", getColor(value))}
        />
      </div>
    </div>
  );
}
