import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Receipt,
  CreditCard,
  Wallet,
  Building2,
  PieChart,
  FileBarChart,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Quotes", url: "/quotes", icon: FileText },
  { title: "Invoices", url: "/invoices", icon: Receipt },
  { title: "Payments", url: "/payments", icon: CreditCard },
  { title: "Expenses", url: "/expenses", icon: Wallet },
  { title: "Transactions", url: "/transactions", icon: Building2 },
  { title: "Tax & Revenue", url: "/tax", icon: PieChart },
  { title: "Reports", url: "/reports", icon: FileBarChart },
];

const bottomItems = [
  { title: "Settings", url: "/settings", icon: Settings },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-sidebar border-r border-sidebar-border"
    >
      {/* Logo */}
      <div className="flex items-center justify-start h-16 px-6 border-b border-sidebar-border">
        <motion.div
          className={cn("flex items-center w-full", collapsed ? "gap-0" : "gap-3")}
          variants={{
            rest: { scale: 1, x: 0 },
            hover: { scale: 1.06, x: 4 },
            tap: { scale: 0.96 },
          }}
          initial="rest"
          animate="rest"
          whileHover="hover"
          whileTap="tap"
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
        >
          <motion.img
            src="/logo.png"
            alt="Spendly"
            className="w-9 h-9 rounded-lg"
            draggable={false}
            initial={{ opacity: 0, scale: 0.85, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 520, damping: 28 }}
            whileHover={{ rotate: -3 }}
          />

          <AnimatePresence mode="wait" initial={false}>
            {!collapsed && (
              <motion.span
                key="brand-expanded"
                initial={{ opacity: 0, x: -16, y: -6, scale: 0.92 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -16, y: 6, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 520, damping: 30 }}
                className={cn(
                  "select-none font-brand leading-none text-2xl font-semibold tracking-wider"
                )}
              >
                <span className="text-sidebar-accent-foreground/90">SPEND</span>
                <motion.span
                  className="inline-block text-sidebar-primary"
                  variants={{
                    rest: { x: 0, y: 0, rotate: 0 },
                    hover: {
                      x: 6,
                      y: 4,
                      rotate: 8,
                      transition: { type: "spring", stiffness: 320, damping: 26, mass: 0.9 },
                    },
                  }}
                >
                  LY
                </motion.span>
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {navigationItems.map((item, index) => (
            <motion.li
              key={item.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03, duration: 0.2 }}
            >
              <NavLink
                to={item.url}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                    collapsed && "justify-center px-2",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0 transition-colors",
                        isActive ? "text-sidebar-primary" : "text-sidebar-muted group-hover:text-sidebar-accent-foreground"
                      )}
                    />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="text-sm font-medium"
                        >
                          {item.title}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </NavLink>
            </motion.li>
          ))}
        </ul>
      </nav>

      {/* Bottom items */}
      <div className="py-4 border-t border-sidebar-border">
        <ul className="space-y-1 px-3">
          {bottomItems.map((item) => (
            <li key={item.title}>
              <NavLink
                to={item.url}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                    collapsed && "justify-center px-2",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0 transition-colors",
                        isActive ? "text-sidebar-primary" : "text-sidebar-muted group-hover:text-sidebar-accent-foreground"
                      )}
                    />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="text-sm font-medium"
                        >
                          {item.title}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>
    </motion.aside>
  );
}
