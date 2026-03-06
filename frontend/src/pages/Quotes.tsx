import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Filter, Download, ChevronDown, MoreHorizontal,
  FileText, CheckCircle, Clock, AlertCircle, XCircle, Eye, ArrowRight,
  Sparkles, X, Send, Edit2, Copy, Trash2, ArrowUpRight, RefreshCw,
  LayoutGrid, List, CalendarDays, BadgePercent, TrendingUp, DollarSign,
  Info, AlertTriangle, ChevronRight, Loader2, CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type QuoteStatus = "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired" | "converted";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

interface Quote {
  id: string;
  number: string;
  client: string;
  issueDate: string;
  expiryDate: string;
  net: number;
  vat: number;
  gross: number;
  status: QuoteStatus;
  lastActivity: string;
  lineItems?: LineItem[];
  reference?: string;
  currency: string;
  invoiceRef?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────────────────

const QUOTES: Quote[] = [
  {
    id: "1", number: "QTE-2026-014", client: "Tech Solutions Ltd",
    issueDate: "Feb 20, 2026", expiryDate: "Mar 22, 2026",
    net: 4500, vat: 1035, gross: 5535, status: "accepted", lastActivity: "2 days ago",
    currency: "€", reference: "REF-TSL-001",
    lineItems: [
      { id: "a", description: "Web Development – Phase 2", quantity: 1, unitPrice: 3000, vatRate: 23 },
      { id: "b", description: "UI/UX Design Review", quantity: 3, unitPrice: 500, vatRate: 23 },
    ],
  },
  {
    id: "2", number: "QTE-2026-013", client: "Creative Agency",
    issueDate: "Feb 18, 2026", expiryDate: "Mar 20, 2026",
    net: 2800, vat: 644, gross: 3444, status: "sent", lastActivity: "5 days ago",
    currency: "€", reference: "REF-CA-019",
    lineItems: [
      { id: "a", description: "Brand Identity Package", quantity: 1, unitPrice: 2800, vatRate: 23 },
    ],
  },
  {
    id: "3", number: "QTE-2026-012", client: "Startup Inc",
    issueDate: "Feb 10, 2026", expiryDate: "Mar 12, 2026",
    net: 1200, vat: 0, gross: 1200, status: "viewed", lastActivity: "1 week ago",
    currency: "€",
    lineItems: [
      { id: "a", description: "SEO Audit & Report", quantity: 1, unitPrice: 1200, vatRate: 0 },
    ],
  },
  {
    id: "4", number: "QTE-2026-011", client: "Global Corp",
    issueDate: "Feb 1, 2026", expiryDate: "Mar 3, 2026",
    net: 8750, vat: 2012.5, gross: 10762.5, status: "converted", lastActivity: "3 weeks ago",
    currency: "€", invoiceRef: "INV-2026-047",
    lineItems: [
      { id: "a", description: "Enterprise Software Licence", quantity: 5, unitPrice: 1500, vatRate: 23 },
      { id: "b", description: "Onboarding & Training", quantity: 1, unitPrice: 1250, vatRate: 23 },
    ],
  },
  {
    id: "5", number: "QTE-2026-010", client: "Local Business",
    issueDate: "Jan 28, 2026", expiryDate: "Feb 27, 2026",
    net: 650, vat: 149.5, gross: 799.5, status: "expired", lastActivity: "1 month ago",
    currency: "€",
    lineItems: [
      { id: "a", description: "Monthly Retainer – Feb", quantity: 1, unitPrice: 650, vatRate: 23 },
    ],
  },
  {
    id: "6", number: "QTE-2026-009", client: "Bright Future Ltd",
    issueDate: "Jan 20, 2026", expiryDate: "Feb 19, 2026",
    net: 3200, vat: 736, gross: 3936, status: "rejected", lastActivity: "1 month ago",
    currency: "€",
    lineItems: [
      { id: "a", description: "Custom App Development", quantity: 1, unitPrice: 3200, vatRate: 23 },
    ],
  },
  {
    id: "7", number: "QTE-2026-015", client: "NextGen Solutions",
    issueDate: "Feb 28, 2026", expiryDate: "Mar 30, 2026",
    net: 5600, vat: 1288, gross: 6888, status: "draft", lastActivity: "Just now",
    currency: "€",
    lineItems: [
      { id: "a", description: "Cloud Migration Consulting", quantity: 8, unitPrice: 700, vatRate: 23 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Status config
// ─────────────────────────────────────────────────────────────────────────────

const statusConfig: Record<QuoteStatus, { label: string; icon: React.ElementType; className: string; dot: string }> = {
  draft:     { label: "Draft",     icon: FileText,     className: "bg-muted text-muted-foreground border-border",           dot: "bg-muted-foreground" },
  sent:      { label: "Sent",      icon: Send,         className: "bg-vat/10 text-vat border-vat/20",                        dot: "bg-vat" },
  viewed:    { label: "Viewed",    icon: Eye,          className: "bg-ai/10 text-ai border-ai/20",                           dot: "bg-ai" },
  accepted:  { label: "Accepted",  icon: CheckCircle,  className: "bg-success/10 text-success border-success/20",            dot: "bg-success" },
  rejected:  { label: "Rejected",  icon: XCircle,      className: "bg-error/10 text-error border-error/20",                  dot: "bg-error" },
  expired:   { label: "Expired",   icon: AlertCircle,  className: "bg-warning/10 text-warning border-warning/20",            dot: "bg-warning" },
  converted: { label: "Converted", icon: ArrowUpRight, className: "bg-accent/10 text-accent border-accent/20",               dot: "bg-accent" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Animated counter hook
// ─────────────────────────────────────────────────────────────────────────────

function useCounter(target: number, duration = 1200, prefix = "", suffix = "", decimals = 0) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>();

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  const formatted = decimals > 0
    ? value.toLocaleString("en-IE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(value).toLocaleString("en-IE");

  return `${prefix}${formatted}${suffix}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat card component
// ─────────────────────────────────────────────────────────────────────────────

interface QuoteStatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon: React.ElementType;
  color: string;          // tailwind bg class for icon bg
  iconColor: string;      // tailwind color class for icon
  sub?: string;
  hoverSub?: string;
  delay?: number;
}

function QuoteStatCard({ title, value, prefix = "", suffix = "", decimals = 0, icon: Icon, color, iconColor, sub, hoverSub, delay = 0 }: QuoteStatCardProps) {
  const displayValue = useCounter(value, 1000 + delay * 100, prefix, suffix, decimals);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.08, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="bg-card rounded-xl p-5 card-elevated group cursor-default relative overflow-hidden"
    >
      {/* Subtle gradient background on hover */}
      <motion.div
        className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300", `bg-gradient-to-br from-transparent via-transparent to-${color.replace("bg-", "").replace("/10", "/5")}`)}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110", color)}>
            <Icon className={cn("w-5 h-5", iconColor)} />
          </div>
          {hoverSub && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileHover={{ opacity: 1, scale: 1 }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{hoverSub}</span>
            </motion.div>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{displayValue}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: QuoteStatus }) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  return (
    <motion.span
      layout
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        cfg.className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </motion.span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI insight chip
// ─────────────────────────────────────────────────────────────────────────────

function AIChip({ message, type = "info", onDismiss }: { message: string; type?: "info" | "warn" | "tip"; onDismiss?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border",
        type === "warn"
          ? "bg-warning/8 text-warning border-warning/20"
          : type === "tip"
          ? "bg-ai/8 text-ai border-ai/20"
          : "bg-vat/8 text-vat border-vat/20"
      )}
    >
      <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-auto hover:opacity-70 transition-opacity">
          <X className="w-3 h-3" />
        </button>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// New Quote Modal
// ─────────────────────────────────────────────────────────────────────────────

interface NewQuoteModalProps {
  open: boolean;
  onClose: () => void;
}

function NewQuoteModal({ open, onClose }: NewQuoteModalProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", description: "", quantity: 1, unitPrice: 0, vatRate: 23 },
  ]);
  const [client, setClient] = useState("");
  const [issueDate] = useState(new Date().toISOString().split("T")[0]);
  const [expiryDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);
  const [aiHint, setAiHint] = useState<string | null>("AI: Standard VAT 23% applies to most professional services in Ireland.");

  const net = lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const vat = lineItems.reduce((s, i) => s + i.quantity * i.unitPrice * (i.vatRate / 100), 0);
  const gross = net + vat;

  const addLine = () => setLineItems(prev => [...prev, { id: String(Date.now()), description: "", quantity: 1, unitPrice: 0, vatRate: 23 }]);
  const removeLine = (id: string) => setLineItems(prev => prev.filter(l => l.id !== id));
  const updateLine = (id: string, field: keyof LineItem, val: string | number) =>
    setLineItems(prev => prev.map(l => l.id === id ? { ...l, [field]: val } : l));

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    setSaving(false);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            key="modal"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-background border-l border-border flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold">New Quote</h2>
                <p className="text-xs text-muted-foreground">Draft saved automatically</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Step indicator */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map(s => (
                    <button
                      key={s}
                      onClick={() => setStep(s)}
                      className={cn(
                        "w-7 h-7 rounded-full text-xs font-medium transition-all",
                        step === s ? "bg-accent text-accent-foreground scale-110" : step > s ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {step > s ? <CheckCheck className="w-3.5 h-3.5 mx-auto" /> : s}
                    </button>
                  ))}
                </div>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <AnimatePresence mode="wait">

                {/* ── Step 1: Client Info ── */}
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center">1</span>
                      Client Information
                    </h3>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Select or create client</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          value={client}
                          onChange={e => setClient(e.target.value)}
                          placeholder="Search existing clients..."
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                        />
                      </div>
                    </div>

                    {/* Quick client cards */}
                    <div className="grid grid-cols-2 gap-2">
                      {["Tech Solutions Ltd", "Creative Agency", "Startup Inc", "Global Corp"].map(name => (
                        <button
                          key={name}
                          onClick={() => setClient(name)}
                          className={cn(
                            "p-3 rounded-lg border text-left text-sm transition-all",
                            client === name ? "border-accent bg-accent/5 text-accent" : "border-border hover:border-accent/50 bg-card"
                          )}
                        >
                          <div className="font-medium text-xs">{name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">IE VAT registered</div>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Entity type</label>
                        <select className="w-full py-2.5 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/20">
                          <option>Company</option>
                          <option>Individual / Sole Trader</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">VAT Number</label>
                        <input placeholder="IE1234567X" className="w-full py-2.5 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/20" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Step 2: Quote Details ── */}
                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center">2</span>
                      Quote Details
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Issue Date</label>
                        <input type="date" defaultValue={issueDate} className="w-full py-2.5 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/20" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Expiry Date <span className="text-accent text-xs">(+30 days)</span></label>
                        <input type="date" defaultValue={expiryDate} className="w-full py-2.5 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/20" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Currency</label>
                        <select className="w-full py-2.5 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/20">
                          <option value="EUR">EUR (€)</option>
                          <option value="USD">USD ($)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Reference No.</label>
                        <input placeholder="REF-001" className="w-full py-2.5 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/20" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Step 3: Line Items ── */}
                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center">3</span>
                      Line Items
                    </h3>

                    <AnimatePresence mode="wait">
                      {aiHint && (
                        <AIChip message={aiHint} type="tip" onDismiss={() => setAiHint(null)} />
                      )}
                    </AnimatePresence>

                    {/* Line headers */}
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                      <div className="col-span-5">Description</div>
                      <div className="col-span-2 text-center">Qty</div>
                      <div className="col-span-2 text-center">Unit €</div>
                      <div className="col-span-2 text-center">VAT %</div>
                      <div className="col-span-1" />
                    </div>

                    <div className="space-y-2">
                      <AnimatePresence>
                        {lineItems.map((item, idx) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="grid grid-cols-12 gap-2 items-center"
                          >
                            <div className="col-span-5">
                              <input
                                value={item.description}
                                onChange={e => updateLine(item.id, "description", e.target.value)}
                                placeholder={`Item ${idx + 1}...`}
                                className="w-full py-2 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={e => updateLine(item.id, "quantity", Number(e.target.value))}
                                min={1}
                                className="w-full py-2 px-2 text-center rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="number"
                                value={item.unitPrice}
                                onChange={e => updateLine(item.id, "unitPrice", Number(e.target.value))}
                                min={0}
                                className="w-full py-2 px-2 text-center rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                              />
                            </div>
                            <div className="col-span-2">
                              <select
                                value={item.vatRate}
                                onChange={e => updateLine(item.id, "vatRate", Number(e.target.value))}
                                className="w-full py-2 px-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                              >
                                <option value={0}>0%</option>
                                <option value={9}>9%</option>
                                <option value={13.5}>13.5%</option>
                                <option value={23}>23%</option>
                              </select>
                            </div>
                            <div className="col-span-1 flex justify-center">
                              {lineItems.length > 1 && (
                                <button onClick={() => removeLine(item.id)} className="p-1.5 rounded hover:bg-error/10 hover:text-error transition-colors">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    <Button variant="outline" size="sm" onClick={addLine} className="gap-2 text-xs">
                      <Plus className="w-3.5 h-3.5" />
                      Add Line Item
                    </Button>

                    {/* Summary */}
                    <motion.div
                      layout
                      className="bg-muted/50 rounded-xl p-4 space-y-2 border border-border"
                    >
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Net Total</span>
                        <span className="font-medium">€{net.toLocaleString("en-IE", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">VAT Total</span>
                        <span className="font-medium text-vat">€{vat.toLocaleString("en-IE", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border">
                        <span>Gross Total</span>
                        <span className="text-accent">€{gross.toLocaleString("en-IE", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                        <Info className="w-3 h-3" />
                        VAT will be recorded only after invoice is issued.
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
              <Button variant="ghost" size="sm" onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}>
                {step > 1 ? "Back" : "Cancel"}
              </Button>
              <div className="flex gap-2">
                {step < 3 ? (
                  <Button onClick={() => setStep(s => s + 1)} className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={handleSave}>Save as Draft</Button>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
                    >
                      {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Send className="w-4 h-4" />Save & Send</>}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quote Detail Side Panel
// ─────────────────────────────────────────────────────────────────────────────

function QuoteDetailPanel({ quote, open, onClose }: { quote: Quote | null; open: boolean; onClose: () => void }) {
  const [converting, setConverting] = useState(false);
  const [converted, setConverted] = useState(false);

  const handleConvert = async () => {
    setConverting(true);
    await new Promise(r => setTimeout(r, 1500));
    setConverting(false);
    setConverted(true);
  };

  const activityLog = [
    { label: "Created", time: quote?.issueDate ?? "", icon: FileText, color: "text-muted-foreground" },
    { label: "Sent to client", time: "1 day later", icon: Send, color: "text-vat" },
    ...(quote?.status === "viewed" || quote?.status === "accepted" || quote?.status === "converted"
      ? [{ label: "Viewed by client", time: "3 days later", icon: Eye, color: "text-ai" }]
      : []),
    ...(quote?.status === "accepted" || quote?.status === "converted"
      ? [{ label: "Accepted", time: "5 days later", icon: CheckCircle, color: "text-success" }]
      : []),
    ...(quote?.status === "converted"
      ? [{ label: `Converted → ${quote.invoiceRef}`, time: "Same day", icon: ArrowUpRight, color: "text-accent" }]
      : []),
  ];

  return (
    <AnimatePresence>
      {open && quote && (
        <>
          <motion.div
            key="detail-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="detail-panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-background border-l border-border flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-semibold">{quote.number}</h2>
                  <StatusBadge status={quote.status} />
                </div>
                <p className="text-xs text-muted-foreground">{quote.client}</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* PDF Preview mock */}
              <div className="mx-6 my-4 rounded-xl border border-border bg-muted/30 overflow-hidden">
                <div className="bg-card p-6 text-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-lg text-accent">QUOTE</div>
                      <div className="text-xs text-muted-foreground mt-1">{quote.number}</div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>Issue: {quote.issueDate}</div>
                      <div>Expiry: {quote.expiryDate}</div>
                    </div>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="font-medium text-xs text-muted-foreground mb-1">TO</div>
                    <div className="font-semibold">{quote.client}</div>
                  </div>
                  {/* Line items */}
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left pb-2">Description</th>
                        <th className="text-right pb-2">Qty</th>
                        <th className="text-right pb-2">Unit</th>
                        <th className="text-right pb-2">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(quote.lineItems ?? []).map(li => (
                        <tr key={li.id} className="border-b border-border/50">
                          <td className="py-1.5">{li.description}</td>
                          <td className="text-right py-1.5">{li.quantity}</td>
                          <td className="text-right py-1.5">€{li.unitPrice.toLocaleString()}</td>
                          <td className="text-right py-1.5">€{(li.quantity * li.unitPrice).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="text-right text-xs space-y-0.5">
                    <div className="text-muted-foreground">Net: €{quote.net.toLocaleString()}</div>
                    <div className="text-vat">VAT: €{quote.vat.toLocaleString()}</div>
                    <div className="font-bold text-base mt-1">Gross: €{quote.gross.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="px-6 pb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Activity</h3>
                <div className="relative pl-5 space-y-3">
                  <div className="absolute left-1.5 top-1 bottom-1 w-px bg-border" />
                  {activityLog.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-start gap-3 relative"
                      >
                        <div className={cn("w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center absolute -left-5", item.color)}>
                          <Icon className="w-2.5 h-2.5" />
                        </div>
                        <div className="flex justify-between w-full text-xs">
                          <span className="font-medium">{item.label}</span>
                          <span className="text-muted-foreground">{item.time}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions panel */}
            <div className="px-6 py-4 border-t border-border space-y-2">
              {/* Convert to Invoice */}
              {(quote.status === "accepted" && !converted) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-success/8 border border-success/20 flex items-center justify-between"
                >
                  <div className="text-xs">
                    <p className="font-semibold text-success">Ready to convert</p>
                    <p className="text-muted-foreground">This quote has been accepted</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleConvert}
                    disabled={converting}
                    className="bg-success hover:bg-success/90 text-success-foreground gap-2 text-xs"
                  >
                    {converting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    {converting ? "Converting..." : "Convert to Invoice"}
                  </Button>
                </motion.div>
              )}
              {converted && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-3 rounded-xl bg-accent/10 border border-accent/20 flex items-center gap-2 text-xs text-accent font-semibold"
                >
                  <CheckCheck className="w-4 h-4" />
                  Invoice created successfully!
                </motion.div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  <Send className="w-3.5 h-3.5" /> Send to Client
                </Button>
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  <Copy className="w-3.5 h-3.5" /> Duplicate
                </Button>
                <Button variant="outline" size="sm" className="gap-2 text-xs text-error hover:text-error hover:border-error/40 hover:bg-error/5">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card View item
// ─────────────────────────────────────────────────────────────────────────────

function QuoteCard({ quote, index, onClick }: { quote: Quote; index: number; onClick: () => void }) {
  const cfg = statusConfig[quote.status];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      onClick={onClick}
      className="bg-card rounded-xl p-4 card-elevated cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-mono text-muted-foreground">{quote.number}</p>
          <p className="font-semibold text-sm mt-0.5">{quote.client}</p>
        </div>
        <StatusBadge status={quote.status} />
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Gross</p>
          <p className="text-lg font-semibold text-accent">
            {quote.currency}{quote.gross.toLocaleString("en-IE", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{quote.issueDate}</p>
          <p className="text-xs text-muted-foreground">Expires {quote.expiryDate}</p>
        </div>
      </div>
      {quote.status === "accepted" && (
        <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5 text-xs text-success">
          <CheckCircle className="w-3.5 h-3.5" />
          Ready to convert to invoice
        </div>
      )}
      {quote.status === "expired" && (
        <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5 text-xs text-warning">
          <AlertTriangle className="w-3.5 h-3.5" />
          Extend or resend this quote
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Quotes page
// ─────────────────────────────────────────────────────────────────────────────

export default function Quotes() {
  const [newQuoteOpen, setNewQuoteOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [periodFilter, setPeriodFilter] = useState<"month" | "quarter" | "year">("month");
  const [globalAiDismissed, setGlobalAiDismissed] = useState(false);

  const filtered = QUOTES.filter(q => {
    const matchSearch = !searchTerm ||
      q.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const total = QUOTES.length;
  const accepted = QUOTES.filter(q => q.status === "accepted" || q.status === "converted").length;
  const pending = QUOTES.filter(q => q.status === "sent" || q.status === "viewed" || q.status === "draft").length;
  const rejected = QUOTES.filter(q => q.status === "rejected").length;
  const pipeline = QUOTES.filter(q => ["draft", "sent", "accepted", "viewed"].includes(q.status))
    .reduce((s, q) => s + q.gross, 0);
  const conversionRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

  const statusFilters: Array<{ value: QuoteStatus | "all"; label: string }> = [
    { value: "all", label: "All" },
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "viewed", label: "Viewed" },
    { value: "accepted", label: "Accepted" },
    { value: "rejected", label: "Rejected" },
    { value: "expired", label: "Expired" },
    { value: "converted", label: "Converted" },
  ];

  return (
    <>
      <div className="space-y-6">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col sm:flex-row sm:items-start justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Quotes</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Create, manage and track client quotes before converting them into invoices.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Period filter */}
            <div className="flex items-center bg-muted rounded-lg p-1 gap-0.5">
              {(["month", "quarter", "year"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriodFilter(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    periodFilter === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p === "month" ? "This Month" : p === "quarter" ? "Quarter" : "This Year"}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              onClick={() => setNewQuoteOpen(true)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 shadow-md shadow-accent/20"
            >
              <Plus className="w-4 h-4" />
              New Quote
            </Button>
          </div>
        </motion.div>

        {/* ── Global AI hint ── */}
        <AnimatePresence>
          {!globalAiDismissed && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ delay: 0.3 }}
            >
              <AIChip
                message="AI: 2 quotes expire within the next 7 days. Consider sending a reminder to Tech Solutions Ltd."
                type="warn"
                onDismiss={() => setGlobalAiDismissed(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Analytics Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <QuoteStatCard
            title="Total Quotes"
            value={total}
            icon={FileText}
            color="bg-secondary"
            iconColor="text-foreground"
            sub="This period"
            delay={0}
          />
          <QuoteStatCard
            title="Accepted"
            value={accepted}
            icon={CheckCircle}
            color="bg-success/10"
            iconColor="text-success"
            hoverSub={`${conversionRate}% rate`}
            sub="Including converted"
            delay={1}
          />
          <QuoteStatCard
            title="Pending"
            value={pending}
            icon={Clock}
            color="bg-vat/10"
            iconColor="text-vat"
            sub="Awaiting response"
            delay={2}
          />
          <QuoteStatCard
            title="Rejected"
            value={rejected}
            icon={XCircle}
            color="bg-error/10"
            iconColor="text-error"
            sub="Closed – lost"
            delay={3}
          />
          <QuoteStatCard
            title="Pipeline Value"
            value={pipeline}
            prefix="€"
            decimals={0}
            icon={TrendingUp}
            color="bg-accent/10"
            iconColor="text-accent"
            hoverSub={`${conversionRate}% conv. rate`}
            sub="Active pipeline"
            delay={4}
          />
        </div>

        {/* ── Conversion rate bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-card rounded-xl p-4 card-elevated"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <BadgePercent className="w-3.5 h-3.5" />
              Conversion Rate
            </span>
            <span className="text-xs font-semibold text-accent">{conversionRate}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${conversionRate}%` }}
              transition={{ delay: 0.6, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              className="h-full bg-gradient-to-r from-accent to-success rounded-full"
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
            <span>{accepted} accepted / {total} total quotes</span>
            <span className="text-success font-medium">+5% vs last period</span>
          </div>
        </motion.div>

        {/* ── Filters & Search ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by client, number..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" /> Filter
            </Button>
            {statusFilters.map(f => (
              <Button
                key={f.value}
                variant={statusFilter === f.value ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter(f.value)}
                className={cn("text-xs transition-all", statusFilter === f.value && "shadow-sm")}
              >
                {f.label}
              </Button>
            ))}
            {/* View toggle */}
            <div className="ml-auto flex items-center bg-muted rounded-lg p-1 gap-0.5">
              <button
                onClick={() => setViewMode("table")}
                className={cn("p-1.5 rounded-md transition-all", viewMode === "table" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("card")}
                className={cn("p-1.5 rounded-md transition-all", viewMode === "card" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Empty state ── */}
        <AnimatePresence>
          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 bg-card rounded-xl card-elevated"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">No quotes found</h3>
              <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters or create a new quote</p>
              <Button onClick={() => setNewQuoteOpen(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
                <Plus className="w-4 h-4" /> New Quote
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Table View ── */}
        <AnimatePresence mode="wait">
          {viewMode === "table" && filtered.length > 0 && (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="bg-card rounded-xl card-elevated overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {["Quote ID", "Client", "Issue Date", "Expiry Date", "Amount", "Status", "Last Activity", ""].map(h => (
                        <th key={h} className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((quote, index) => (
                      <motion.tr
                        key={quote.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.04 }}
                        onClick={() => setSelectedQuote(quote)}
                        className="hover:bg-muted/30 transition-colors group cursor-pointer"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-medium">{quote.number}</span>
                            {quote.invoiceRef && (
                              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 text-xs">
                                {quote.invoiceRef}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-medium">{quote.client}</td>
                        <td className="px-5 py-4 text-sm text-muted-foreground whitespace-nowrap">{quote.issueDate}</td>
                        <td className="px-5 py-4 text-sm text-muted-foreground whitespace-nowrap">
                          <span className={cn(
                            quote.status === "expired" ? "text-warning" : ""
                          )}>
                            {quote.expiryDate}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <span className="font-semibold text-sm text-accent">
                              {quote.currency}{quote.gross.toLocaleString("en-IE", { minimumFractionDigits: 2 })}
                            </span>
                            <div className="text-xs text-muted-foreground">
                              Net €{quote.net.toLocaleString()} · VAT €{quote.vat.toLocaleString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={quote.status} />
                        </td>
                        <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">{quote.lastActivity}</td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            {quote.status === "accepted" && (
                              <button
                                onClick={e => { e.stopPropagation(); setSelectedQuote(quote); }}
                                className="p-1.5 rounded-md hover:bg-success/10 text-success transition-colors text-xs font-medium flex items-center gap-1"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {quote.status === "expired" && (
                              <button className="p-1.5 rounded-md hover:bg-warning/10 text-warning transition-colors">
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button className="p-1.5 rounded-md hover:bg-muted transition-colors">
                              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Footer */}
              <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>{filtered.length} of {QUOTES.length} quotes</span>
                <div className="flex items-center gap-4">
                  <span>
                    Total pipeline: <span className="font-semibold text-accent">
                      €{QUOTES.filter(q => ["draft","sent","accepted","viewed"].includes(q.status)).reduce((s, q) => s + q.gross, 0).toLocaleString("en-IE", { minimumFractionDigits: 2 })}
                    </span>
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Card View ── */}
          {viewMode === "card" && filtered.length > 0 && (
            <motion.div
              key="cards"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filtered.map((quote, index) => (
                <QuoteCard
                  key={quote.id}
                  quote={quote}
                  index={index}
                  onClick={() => setSelectedQuote(quote)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Analytics section ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {/* By client */}
          <div className="bg-card rounded-xl p-5 card-elevated">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              Acceptance by Client
            </h3>
            <div className="space-y-3">
              {[
                { client: "Tech Solutions Ltd", rate: 85, quotes: 7 },
                { client: "Global Corp", rate: 72, quotes: 5 },
                { client: "Creative Agency", rate: 60, quotes: 4 },
                { client: "Startup Inc", rate: 40, quotes: 3 },
              ].map((item, i) => (
                <motion.div
                  key={item.client}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.08 }}
                >
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{item.client}</span>
                    <span className="text-muted-foreground">{item.rate}% · {item.quotes} quotes</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.rate}%` }}
                      transition={{ delay: 0.9 + i * 0.08, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                      className={cn(
                        "h-full rounded-full",
                        item.rate >= 70 ? "bg-success" : item.rate >= 50 ? "bg-accent" : "bg-warning"
                      )}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Monthly pipeline */}
          <div className="bg-card rounded-xl p-5 card-elevated">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-accent" />
              Monthly Pipeline Trend
            </h3>
            <div className="flex items-end gap-2 h-24">
              {[
                { month: "Oct", value: 12000 },
                { month: "Nov", value: 18500 },
                { month: "Dec", value: 14000 },
                { month: "Jan", value: 22000 },
                { month: "Feb", value: 26823 },
                { month: "Mar", value: 31000, forecast: true },
              ].map((bar, i) => {
                const max = 31000;
                const pct = (bar.value / max) * 100;
                return (
                  <div key={bar.month} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-full relative flex items-end" style={{ height: "80px" }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${pct}%` }}
                        transition={{ delay: 0.9 + i * 0.07, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                        className={cn(
                          "w-full rounded-t-md",
                          bar.forecast
                            ? "bg-accent/30 border-2 border-dashed border-accent/50"
                            : "bg-accent/70 group-hover:bg-accent transition-colors"
                        )}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{bar.month}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-accent/30 border border-dashed border-accent/50 inline-block" />
              Mar forecast based on active pipeline
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Modals / Panels ── */}
      <NewQuoteModal open={newQuoteOpen} onClose={() => setNewQuoteOpen(false)} />
      <QuoteDetailPanel
        quote={selectedQuote}
        open={!!selectedQuote}
        onClose={() => setSelectedQuote(null)}
      />
    </>
  );
}
