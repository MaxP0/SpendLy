import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Filter, Download, ChevronDown, MoreHorizontal,
  FileText, CheckCircle, Clock, AlertCircle, XCircle, Eye, ArrowRight,
  Sparkles, X, Send, Edit2, Copy, Trash2, ArrowUpRight, RefreshCw,
  LayoutGrid, List, CalendarDays, BadgePercent, TrendingUp, DollarSign,
  Info, AlertTriangle, ChevronRight, Loader2, CheckCheck,
export { default } from "./Inquiries";
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
