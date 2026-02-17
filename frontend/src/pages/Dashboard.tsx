import { motion } from "framer-motion";
import { TrendingUp, Wallet, Receipt, PiggyBank, Percent } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { AIInsightsPanel } from "@/components/dashboard/AIInsightsPanel";
import { DeadlinesPanel } from "@/components/dashboard/DeadlinesPanel";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { TaxConfidenceIndicator } from "@/components/dashboard/TaxConfidenceIndicator";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { IncomeExpenseChart } from "@/components/dashboard/IncomeExpenseChart";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, John. Here's your financial overview.
        </p>
      </motion.div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Income (YTD)"
          value="€147,100"
          change={{ value: "+12.5%", trend: "up", label: "vs last year" }}
          icon={TrendingUp}
          variant="accent"
          delay={0}
        />
        <StatCard
          title="Total Expenses"
          value="€52,600"
          change={{ value: "+8.2%", trend: "up", label: "vs last year" }}
          icon={Wallet}
          delay={1}
        />
        <StatCard
          title="Net Profit"
          value="€94,500"
          change={{ value: "+15.3%", trend: "up", label: "vs last year" }}
          icon={PiggyBank}
          variant="success"
          delay={2}
        />
        <StatCard
          title="Estimated Tax Due"
          value="€18,920"
          icon={Receipt}
          variant="warning"
          delay={3}
        />
        <StatCard
          title="VAT Balance"
          value="€2,450"
          icon={Percent}
          variant="vat"
          delay={4}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Chart + Transactions */}
        <div className="lg:col-span-2 space-y-6">
          <IncomeExpenseChart />
          <RecentTransactions />
        </div>

        {/* Right Column - Insights + Tax + Deadlines */}
        <div className="space-y-6">
          <TaxConfidenceIndicator 
            score={84} 
            label="Ready for tax season"
            issues={[
              "3 unmatched transactions",
              "2 receipts pending review"
            ]}
          />
          <AIInsightsPanel />
          <DeadlinesPanel />
        </div>
      </div>
    </div>
  );
}
