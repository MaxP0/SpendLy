import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Download, 
  Info, 
  ShieldCheck,
  TrendingUp,
  Wallet,
  Receipt,
  Percent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, title: "Review Income", description: "Verify all income sources", completed: true },
  { id: 2, title: "Review Expenses", description: "Confirm deductible expenses", completed: true },
  { id: 3, title: "VAT Summary", description: "Review VAT collected & paid", completed: true },
  { id: 4, title: "Other Income", description: "Rental, investments, etc.", completed: false, current: true },
  { id: 5, title: "Adjustments", description: "Reliefs and credits", completed: false },
  { id: 6, title: "Final Summary", description: "Generate declaration", completed: false },
];

const summaryCards = [
  { title: "Gross Income", value: "€147,100", icon: TrendingUp, variant: "default" as const },
  { title: "Allowable Expenses", value: "€52,600", icon: Wallet, variant: "default" as const },
  { title: "Taxable Profit", value: "€94,500", icon: Receipt, variant: "accent" as const },
  { title: "Est. Tax Liability", value: "€18,920", icon: Percent, variant: "warning" as const },
];

export default function Tax() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tax & Revenue</h1>
          <p className="text-muted-foreground mt-1">Prepare your tax declaration for Revenue</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export for ROS
          </Button>
        </div>
      </motion.div>

      {/* Tax Year Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {summaryCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className={cn(
              "bg-card rounded-xl p-5 card-elevated",
              card.variant === "accent" && "ring-2 ring-accent/20",
              card.variant === "warning" && "ring-2 ring-warning/20"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
              card.variant === "accent" ? "bg-accent/10" : card.variant === "warning" ? "bg-warning/10" : "bg-secondary"
            )}>
              <card.icon className={cn(
                "w-5 h-5",
                card.variant === "accent" ? "text-accent" : card.variant === "warning" ? "text-warning" : "text-foreground"
              )} />
            </div>
            <p className="text-sm text-muted-foreground">{card.title}</p>
            <p className="text-2xl font-semibold tracking-tight mt-1">{card.value}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Declaration Builder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-card rounded-xl card-elevated"
        >
          <div className="p-5 border-b border-border">
            <h3 className="text-sm font-semibold">Declaration Builder</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Complete each step to prepare your tax return</p>
          </div>

          <div className="p-5">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">50% Complete</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "50%" }}
                  transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-accent rounded-full"
                />
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg transition-colors",
                    step.current ? "bg-accent/5 ring-1 ring-accent/20" : "hover:bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    step.completed ? "bg-success text-success-foreground" : 
                    step.current ? "bg-accent text-accent-foreground" : "bg-muted"
                  )}>
                    {step.completed ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-medium",
                      step.completed && "text-muted-foreground"
                    )}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                  {step.current && (
                    <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground gap-1">
                      Continue
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  )}
                  {step.completed && (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                      Done
                    </Badge>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Readiness Check */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl p-5 card-elevated"
          >
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold">Submission Checklist</h3>
            </div>

            <div className="space-y-3">
              {[
                { label: "All income recorded", done: true },
                { label: "Expenses categorised", done: true },
                { label: "Receipts attached", done: false },
                { label: "VAT reconciled", done: true },
                { label: "Bank accounts synced", done: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center",
                    item.done ? "bg-success/10" : "bg-muted"
                  )}>
                    {item.done ? (
                      <CheckCircle2 className="w-3 h-3 text-success" />
                    ) : (
                      <Circle className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                  <span className={cn(
                    "text-sm",
                    item.done ? "text-muted-foreground" : "text-foreground"
                  )}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Help Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-hero rounded-xl p-5 text-primary-foreground"
          >
            <Info className="w-5 h-5 mb-3 opacity-80" />
            <h4 className="font-semibold mb-1">Need help?</h4>
            <p className="text-sm opacity-80 mb-4">
              Our AI assistant can help explain tax terms and guide you through the process.
            </p>
            <Button variant="secondary" size="sm" className="w-full">
              Get Help
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
