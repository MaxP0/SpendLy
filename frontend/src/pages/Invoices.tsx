import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { CalendarIcon, Check, Download, Pencil, Plus, Search, Send, X } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCustomers } from "@/hooks/useCustomers";
import { useInquiries } from "@/hooks/useInquiries";
import {
  useCancelInvoice,
  useCreateInvoice,
  useDownloadInvoicePdf,
  useInvoice,
  useInvoices,
  useIssueInvoice,
  useUpdateInvoice,
} from "@/hooks/useInvoices";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { Customer, Inquiry, Invoice, InvoiceFilters, InvoiceLineItemPayload, InvoicePayload, InvoiceStatus } from "@/types/api";

const pageSize = 20;
const invoiceStatusOptions: Array<{ value: "all" | InvoiceStatus; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "issued", label: "Issued" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];
const vatRateOptions = [23, 13.5, 9, 0];

const invoiceLineItemSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than zero"),
  unit_price: z.coerce.number().nonnegative("Unit price cannot be negative"),
  vat_rate: z.coerce.number().min(0).max(23),
});

const invoiceFormSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  standalone: z.boolean().default(false),
  inquiry_id: z.string().optional().or(z.literal("")),
  due_at: z.string().min(1, "Due date is required"),
  currency: z.string().min(1).default("EUR"),
  reference: z.string().optional().or(z.literal("")),
  line_items: z.array(invoiceLineItemSchema).min(1, "Add at least one line item"),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value ?? 0);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }
  return format(new Date(value), "dd MMM yyyy");
}

function emptyInvoiceFormValues(isVatUser: boolean): InvoiceFormValues {
  return {
    customer_id: "",
    standalone: false,
    inquiry_id: "",
    due_at: "",
    currency: "EUR",
    reference: "",
    line_items: [{ description: "", quantity: 1, unit_price: 0, vat_rate: isVatUser ? 23 : 0 }],
  };
}

function toFormValues(invoice: Invoice | null, isVatUser: boolean): InvoiceFormValues {
  if (!invoice) {
    return emptyInvoiceFormValues(isVatUser);
  }

  return {
    customer_id: invoice.customer_id,
    standalone: !invoice.inquiry_id,
    inquiry_id: invoice.inquiry_id ?? "",
    due_at: invoice.due_at ?? "",
    currency: invoice.currency,
    reference: invoice.reference ?? "",
    line_items: invoice.line_items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      vat_rate: isVatUser ? item.vat_rate : 0,
    })),
  };
}

function lineItemsToPayload(items: InvoiceFormValues["line_items"], isVatUser: boolean): InvoiceLineItemPayload[] {
  return items.map((item) => ({
    description: item.description.trim(),
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    vat_rate: isVatUser ? Number(item.vat_rate) : 0,
  }));
}

export function computeTotals(items: InvoiceFormValues["line_items"], isVatUser: boolean) {
  const vatMap = new Map<number, { net: number; vat: number }>();
  let subtotal = 0;
  let vatTotal = 0;

  for (const item of items) {
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unit_price || 0);
    const vatRate = isVatUser ? Number(item.vat_rate || 0) : 0;
    const lineNet = roundCurrency(quantity * unitPrice);
    const lineVat = roundCurrency((lineNet * vatRate) / 100);
    subtotal = roundCurrency(subtotal + lineNet);
    vatTotal = roundCurrency(vatTotal + lineVat);
    const bucket = vatMap.get(vatRate) ?? { net: 0, vat: 0 };
    bucket.net = roundCurrency(bucket.net + lineNet);
    bucket.vat = roundCurrency(bucket.vat + lineVat);
    vatMap.set(vatRate, bucket);
  }

  return {
    subtotal,
    vatTotal,
    total: roundCurrency(subtotal + vatTotal),
    vatBreakdown: Array.from(vatMap.entries())
      .map(([rate, values]) => ({ rate, ...values }))
      .sort((left, right) => left.rate - right.rate),
  };
}

function filterInvoices(invoices: Invoice[], search: string) {
  if (!search.trim()) {
    return invoices;
  }
  const query = search.trim().toLowerCase();
  return invoices.filter((invoice) =>
    [invoice.invoice_number ?? "draft", invoice.customer_name_snapshot, invoice.reference ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(query),
  );
}

export default function InvoicesPage() {
  const { user } = useAuth();
  const isVatUser = user?.role === "self_employed_vat";
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);

  const invoicesFilters: InvoiceFilters = {
    status: statusFilter === "all" ? undefined : statusFilter,
    customer_id: customerFilter !== "all" ? customerFilter : undefined,
    from: fromDate ? format(fromDate, "yyyy-MM-dd") : undefined,
    to: toDate ? format(toDate, "yyyy-MM-dd") : undefined,
    limit: pageSize,
    offset: 0,
  };

  const invoicesQuery = useInvoices(invoicesFilters);
  const customersQuery = useCustomers({ limit: 100, offset: 0, search: undefined });
  const detailQuery = useInvoice(selectedInvoiceId);

  const createInvoiceMutation = useCreateInvoice();
  const updateInvoiceMutation = useUpdateInvoice();
  const issueInvoiceMutation = useIssueInvoice();
  const cancelInvoiceMutation = useCancelInvoice();
  const downloadPdfMutation = useDownloadInvoicePdf();

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: emptyInvoiceFormValues(isVatUser),
  });
  const lineItemsFieldArray = useFieldArray({ control: form.control, name: "line_items" });

  const selectedCustomerId = form.watch("customer_id");
  const standalone = form.watch("standalone");
  const linkedInquiryId = form.watch("inquiry_id") ?? "";
  const watchedLineItems = form.watch("line_items");
  const liveTotals = useMemo(() => computeTotals(watchedLineItems, isVatUser), [isVatUser, watchedLineItems]);

  const linkedInquiriesQuery = useInquiries({
    customer_id: !standalone && selectedCustomerId ? selectedCustomerId : undefined,
    status: "accepted,invoiced",
    limit: 100,
    offset: 0,
  });

  const filteredInvoices = useMemo(
    () => filterInvoices(invoicesQuery.data?.items ?? [], searchInput),
    [invoicesQuery.data?.items, searchInput],
  );
  const customers = customersQuery.data?.items ?? [];
  const linkedInquiries = (linkedInquiriesQuery.data?.items ?? []).filter((inquiry) =>
    selectedCustomerId ? inquiry.customer_id === selectedCustomerId : true,
  );
  const selectedInvoice = detailQuery.data ?? filteredInvoices.find((invoice) => invoice.id === selectedInvoiceId) ?? null;
  const selectedLinkedInquiry = linkedInquiries.find((inquiry) => inquiry.id === linkedInquiryId) ?? null;

  useEffect(() => {
    if (standalone) {
      form.setValue("inquiry_id", "");
    }
  }, [form, standalone]);

  const openCreateSheet = () => {
    setEditingInvoice(null);
    const nextValues = emptyInvoiceFormValues(isVatUser);
    form.reset(nextValues);
    lineItemsFieldArray.replace(nextValues.line_items);
    setFormOpen(true);
  };

  const openEditSheet = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    const nextValues = toFormValues(invoice, isVatUser);
    form.reset(nextValues);
    lineItemsFieldArray.replace(nextValues.line_items);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingInvoice(null);
    form.reset(emptyInvoiceFormValues(isVatUser));
    lineItemsFieldArray.replace(emptyInvoiceFormValues(isVatUser).line_items);
  };

  const handleInquiryChange = (value: string) => {
    form.setValue("inquiry_id", value);
    const inquiry = linkedInquiries.find((item) => item.id === value);
    if (!inquiry) {
      return;
    }
    lineItemsFieldArray.replace(
      inquiry.line_items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        vat_rate: isVatUser ? item.vat_rate : 0,
      })),
    );
  };

  const buildPayload = (values: InvoiceFormValues): InvoicePayload => ({
    customer_id: values.customer_id,
    inquiry_id: values.standalone ? null : values.inquiry_id || null,
    due_at: values.due_at,
    currency: values.currency,
    reference: values.reference?.trim() || null,
    line_items: lineItemsToPayload(values.line_items, isVatUser),
  });

  const saveInvoice = async (values: InvoiceFormValues, issueAfterSave: boolean) => {
    const payload = buildPayload(values);

    try {
      const savedInvoice = editingInvoice
        ? await updateInvoiceMutation.mutateAsync({ id: editingInvoice.id, payload })
        : await createInvoiceMutation.mutateAsync(payload);

      const finalInvoice = issueAfterSave
        ? await issueInvoiceMutation.mutateAsync(savedInvoice.id)
        : savedInvoice;

      toast.success(issueAfterSave ? "Invoice saved and issued" : "Invoice saved as draft");
      setSelectedInvoiceId(finalInvoice.id);
      closeForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save invoice");
    }
  };

  const handleIssue = async (invoiceId: string) => {
    try {
      await issueInvoiceMutation.mutateAsync(invoiceId);
      toast.success("Invoice issued");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to issue invoice");
    }
  };

  const handleCancelSelected = async () => {
    if (!selectedInvoice) return;
    try {
      await cancelInvoiceMutation.mutateAsync(selectedInvoice.id);
      toast.success("Invoice cancelled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to cancel invoice");
    }
  };

  const handleDownloadPdf = async (invoiceId: string) => {
    try {
      await downloadPdfMutation.mutateAsync(invoiceId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to download invoice PDF");
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="mt-1 text-muted-foreground">Manage, issue, and download your tax invoices.</p>
        </div>
        <Button className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90" onClick={openCreateSheet}>
          <Plus className="h-4 w-4" />
          New Invoice
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-3 lg:grid-cols-[1.5fr,220px,220px,220px,220px]"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search number, customer, or reference"
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {invoiceStatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={customerFilter} onValueChange={setCustomerFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Customer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All customers</SelectItem>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start gap-2 font-normal">
              <CalendarIcon className="h-4 w-4" />
              {fromDate ? format(fromDate, "dd MMM yyyy") : "From date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start gap-2 font-normal">
              <CalendarIcon className="h-4 w-4" />
              {toDate ? format(toDate, "dd MMM yyyy") : "To date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={toDate} onSelect={setToDate} initialFocus />
          </PopoverContent>
        </Popover>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="overflow-hidden rounded-xl bg-card card-elevated"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedInvoiceId(invoice.id)}
                >
                  <TableCell className="font-medium">{invoice.invoice_number ?? "Draft"}</TableCell>
                  <TableCell>{invoice.customer_name_snapshot}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(invoice.issued_at)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(invoice.due_at)}</TableCell>
                  <TableCell>{formatCurrency(invoice.total)}</TableCell>
                  <TableCell><InvoiceStatusBadge status={invoice.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {invoice.status === "draft" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(event) => {
                            event.stopPropagation();
                            openEditSheet(invoice);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      ) : null}
                      {invoice.status === "draft" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleIssue(invoice.id);
                          }}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDownloadPdf(invoice.id);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!filteredInvoices.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    {invoicesQuery.isLoading ? "Loading invoices..." : "No invoices match the current filters."}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      <Sheet open={formOpen} onOpenChange={(open) => (open ? setFormOpen(true) : closeForm())}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle>{editingInvoice ? "Edit draft invoice" : "Create invoice"}</SheetTitle>
            <SheetDescription>Build the invoice from line items and issue it when you are ready.</SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form className="mt-6 space-y-6" onSubmit={form.handleSubmit((values) => void saveInvoice(values, false))}>
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => {
                  const selectedCustomer = customers.find((customer) => customer.id === field.value) ?? null;
                  return (
                    <FormItem className="flex flex-col">
                      <FormLabel>Customer</FormLabel>
                      <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" role="combobox" className="justify-between">
                              {selectedCustomer ? selectedCustomer.name : "Select customer"}
                              <Check className={cn("ml-2 h-4 w-4 opacity-0", selectedCustomer ? "opacity-100" : "opacity-50")} />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search customers..." />
                            <CommandList>
                              <CommandEmpty>No customers found.</CommandEmpty>
                              <CommandGroup>
                                {customers.map((customer: Customer) => (
                                  <CommandItem
                                    key={customer.id}
                                    value={`${customer.name} ${customer.email ?? ""}`}
                                    onSelect={() => {
                                      field.onChange(customer.id);
                                      setCustomerPopoverOpen(false);
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", customer.id === field.value ? "opacity-100" : "opacity-0")} />
                                    <div>
                                      <div>{customer.name}</div>
                                      {customer.email ? <div className="text-xs text-muted-foreground">{customer.email}</div> : null}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="standalone"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 rounded-lg border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                    </FormControl>
                    <div className="space-y-1">
                      <FormLabel className="text-sm font-medium">Standalone invoice (no inquiry)</FormLabel>
                      <p className="text-sm text-muted-foreground">Use this for one-off work that was not quoted through an inquiry.</p>
                    </div>
                  </FormItem>
                )}
              />

              {!standalone ? (
                <div data-testid="linked-inquiry-field">
                  <FormField
                    control={form.control}
                    name="inquiry_id"
                    render={({ field }) => (
                      <FormItem>
                      <FormLabel>Linked Inquiry</FormLabel>
                      <Select value={field.value || "none"} onValueChange={(value) => handleInquiryChange(value === "none" ? "" : value)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose an accepted inquiry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No linked inquiry</SelectItem>
                          {linkedInquiries.map((inquiry: Inquiry) => (
                            <SelectItem key={inquiry.id} value={inquiry.id}>
                              {inquiry.title} · {inquiry.status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedLinkedInquiry?.status === "invoiced" ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                          This inquiry already has {selectedLinkedInquiry.related_invoices.length} invoice
                          {selectedLinkedInquiry.related_invoices.length === 1 ? "" : "s"} — adding another for staged billing.
                        </div>
                      ) : null}
                      <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="due_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="PO-2026-42" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">Line items</h2>
                    <p className="text-sm text-muted-foreground">Totals are calculated live and validated again by the backend.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => lineItemsFieldArray.append({ description: "", quantity: 1, unit_price: 0, vat_rate: isVatUser ? 23 : 0 })}
                  >
                    <Plus className="h-4 w-4" />
                    Add line item
                  </Button>
                </div>

                {lineItemsFieldArray.fields.map((item, index) => (
                  <div key={item.id} className="grid gap-3 rounded-xl border p-4 md:grid-cols-[2fr,120px,140px,140px,auto]">
                    <FormField
                      control={form.control}
                      name={`line_items.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Labour, materials, call-out..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`line_items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qty</FormLabel>
                          <FormControl>
                            <Input data-testid={`line-item-quantity-${index}`} type="number" min="0" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`line_items.${index}.unit_price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit price</FormLabel>
                          <FormControl>
                            <Input data-testid={`line-item-unit-price-${index}`} type="number" min="0" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {isVatUser ? (
                      <FormField
                        control={form.control}
                        name={`line_items.${index}.vat_rate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>VAT rate</FormLabel>
                            <Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="VAT rate" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {vatRateOptions.map((rate) => (
                                  <SelectItem key={rate} value={String(rate)}>
                                    {rate}%
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <div className="flex items-end">
                        <div className="w-full rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">VAT not applicable</div>
                      </div>
                    )}
                    <div className="flex items-end justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove line item ${index + 1}`}
                        disabled={lineItemsFieldArray.fields.length === 1}
                        onClick={() => lineItemsFieldArray.remove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold">Live totals</h3>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between"><span>Net</span><span data-testid="invoice-net-total">{formatCurrency(liveTotals.subtotal)}</span></div>
                      <div className="flex items-center justify-between"><span>VAT</span><span data-testid="invoice-vat-total">{formatCurrency(liveTotals.vatTotal)}</span></div>
                      <div className="flex items-center justify-between font-semibold"><span>Gross</span><span data-testid="invoice-gross-total">{formatCurrency(liveTotals.total)}</span></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">VAT breakdown</h3>
                    <div className="mt-3 space-y-2 text-sm">
                      {liveTotals.vatBreakdown.map((bucket) => (
                        <div key={bucket.rate} className="flex items-center justify-between">
                          <span>{bucket.rate}%</span>
                          <span>{formatCurrency(bucket.vat)} on {formatCurrency(bucket.net)}</span>
                        </div>
                      ))}
                      {!liveTotals.vatBreakdown.length ? <p className="text-muted-foreground">No VAT on current line items.</p> : null}
                    </div>
                  </div>
                </div>
              </div>

              <SheetFooter className="gap-2 sm:justify-between">
                <Button type="button" variant="outline" onClick={() => form.handleSubmit((values) => void saveInvoice(values, false))()}>
                  Save as Draft
                </Button>
                <Button type="button" className="gap-2" onClick={() => form.handleSubmit((values) => void saveInvoice(values, true))()}>
                  <Send className="h-4 w-4" />
                  Save &amp; Issue
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(selectedInvoiceId)} onOpenChange={(open) => (!open ? setSelectedInvoiceId(null) : undefined)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{selectedInvoice?.invoice_number ?? "Draft invoice"}</SheetTitle>
            <SheetDescription>{selectedInvoice?.customer_name_snapshot ?? "Invoice detail"}</SheetDescription>
          </SheetHeader>

          {selectedInvoice ? (
            <div className="mt-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <InvoiceStatusBadge status={selectedInvoice.status} />
                <div className="flex flex-wrap gap-2">
                  {selectedInvoice.status === "draft" ? (
                    <Button variant="outline" onClick={() => openEditSheet(selectedInvoice)}>
                      Edit draft
                    </Button>
                  ) : null}
                  {selectedInvoice.status === "draft" ? (
                    <Button onClick={() => void handleIssue(selectedInvoice.id)}>
                      Issue invoice
                    </Button>
                  ) : null}
                  {selectedInvoice.status === "issued" ? (
                    <Button variant="outline" onClick={() => void handleCancelSelected()}>
                      Cancel invoice
                    </Button>
                  ) : null}
                  <Button variant="outline" onClick={() => void handleDownloadPdf(selectedInvoice.id)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 rounded-xl border p-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold">Customer snapshot</h3>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{selectedInvoice.customer_name_snapshot}</p>
                    {selectedInvoice.customer_address_snapshot ? <p>{selectedInvoice.customer_address_snapshot}</p> : null}
                    {selectedInvoice.customer_email_snapshot ? <p>{selectedInvoice.customer_email_snapshot}</p> : null}
                    {selectedInvoice.customer_phone_snapshot ? <p>{selectedInvoice.customer_phone_snapshot}</p> : null}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Invoice meta</h3>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p>Issued: {formatDate(selectedInvoice.issued_at)}</p>
                    <p>Due: {formatDate(selectedInvoice.due_at)}</p>
                    <p>Reference: {selectedInvoice.reference ?? "-"}</p>
                    <p>Currency: {selectedInvoice.currency}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <h3 className="text-sm font-semibold">Line items</h3>
                <Table className="mt-3">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>VAT</TableHead>
                      <TableHead>Net</TableHead>
                      <TableHead>VAT Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.line_items.map((item) => (
                      <TableRow key={item.id ?? item.description}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell>{item.vat_rate}%</TableCell>
                        <TableCell>{formatCurrency(item.line_total_net)}</TableCell>
                        <TableCell>{formatCurrency(item.line_total_vat)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-4 rounded-xl border p-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold">VAT breakdown</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    {selectedInvoice.vat_breakdown.map((bucket) => (
                      <div key={bucket.rate} className="flex items-center justify-between">
                        <span>{bucket.rate}%</span>
                        <span>{formatCurrency(bucket.vat)} on {formatCurrency(bucket.net)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Totals</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between"><span>Subtotal</span><span>{formatCurrency(selectedInvoice.subtotal)}</span></div>
                    <div className="flex items-center justify-between"><span>VAT</span><span>{formatCurrency(selectedInvoice.vat_total)}</span></div>
                    <div className="flex items-center justify-between font-semibold"><span>Total</span><span>{formatCurrency(selectedInvoice.total)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">Loading invoice…</p>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
