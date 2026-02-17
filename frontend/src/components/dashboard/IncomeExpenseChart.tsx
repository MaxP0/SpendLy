import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", income: 12400, expenses: 4200 },
  { month: "Feb", income: 15200, expenses: 5100 },
  { month: "Mar", income: 18900, expenses: 6300 },
  { month: "Apr", income: 14200, expenses: 5800 },
  { month: "May", income: 21300, expenses: 7200 },
  { month: "Jun", income: 19800, expenses: 6900 },
  { month: "Jul", income: 24500, expenses: 8100 },
  { month: "Aug", income: 22100, expenses: 7600 },
  { month: "Sep", income: 18700, expenses: 6400 },
];

export function IncomeExpenseChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="bg-card rounded-xl p-5 card-elevated"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold">Income vs Expenses</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Year to date overview</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-xs text-muted-foreground">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            <span className="text-xs text-muted-foreground">Expenses</span>
          </div>
        </div>
      </div>

      <div className="h-[240px] -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(168, 76%, 42%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(168, 76%, 42%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(215, 16%, 47%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(215, 16%, 47%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" vertical={false} />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(215, 16%, 47%)' }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(215, 16%, 47%)' }}
              tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 100%)',
                border: '1px solid hsl(214, 32%, 91%)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: number) => [`€${value.toLocaleString()}`, '']}
              labelStyle={{ fontWeight: 600, marginBottom: 4 }}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="hsl(168, 76%, 42%)"
              strokeWidth={2}
              fill="url(#incomeGradient)"
              name="Income"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="hsl(215, 16%, 47%)"
              strokeWidth={2}
              fill="url(#expenseGradient)"
              name="Expenses"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
