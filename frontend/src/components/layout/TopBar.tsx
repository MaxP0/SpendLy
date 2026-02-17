import { Bell, Calendar, ChevronDown, Search, User } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TopBarProps {
  sidebarCollapsed: boolean;
}

export function TopBar({ sidebarCollapsed }: TopBarProps) {
  return (
    <motion.header
      initial={false}
      animate={{ marginLeft: sidebarCollapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="fixed top-0 right-0 left-0 h-16 bg-background/80 backdrop-blur-md border-b border-border z-30"
    >
      <div className="flex items-center justify-between h-full px-6">
        {/* Left side - Tax period */}
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">2024 Tax Year</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Center - Quick status */}
        <div className="hidden md:flex items-center gap-3">
          <StatusBadge 
            label="VAT Due" 
            value="€2,450" 
            variant="warning" 
            dueIn="12 days"
          />
          <div className="w-px h-6 bg-border" />
          <StatusBadge 
            label="Est. Income Tax" 
            value="€8,920" 
            variant="default" 
          />
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
          </Button>
          <div className="w-px h-6 bg-border mx-2" />
          <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-secondary transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-hero flex items-center justify-center">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium hidden lg:block">John Murphy</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground hidden lg:block" />
          </button>
        </div>
      </div>
    </motion.header>
  );
}

interface StatusBadgeProps {
  label: string;
  value: string;
  variant?: "default" | "warning" | "success";
  dueIn?: string;
}

function StatusBadge({ label, value, variant = "default", dueIn }: StatusBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
      {dueIn && (
        <Badge 
          variant="outline" 
          className={
            variant === "warning" 
              ? "bg-warning/10 text-warning border-warning/20 text-xs" 
              : "text-xs"
          }
        >
          {dueIn}
        </Badge>
      )}
    </div>
  );
}
