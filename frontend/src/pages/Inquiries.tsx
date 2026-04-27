import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Archive,
  Copy,
  Eye,
  FilePlus2,
  Mail,
  MessageSquareText,
  Plus,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";

import { InquiryStatusBadge } from "@/components/inquiries/InquiryStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCustomers } from "@/hooks/useCustomers";
import {
  useArchiveInquiry,
  useCreateInquiry,
  useDeleteInquiry,
  useDownloadInquiryQuotePdf,
  useInquiries,
  useInquiry,
  useSendInquiry,
  useUnarchiveInquiry,
  useUpdateInquiry,
} from "@/hooks/useInquiries";
import type { Customer, Inquiry, InquiryLineItemPayload, InquiryPayload, InquiryStatus } from "@/types/api";

const pageSize = 20;
const statusOptions: InquiryStatus[] = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "discussion_requested",
  "expired",
  "invoiced",
  "completed",
  "archived",
];

const lineItemSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than zero"),
  unit_price: z.coerce.number().nonnegative("Unit price cannot be negative"),
  vat_rate: z.coerce.number().min(0).max(100),
});

const inquiryFormSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional().or(z.literal("")),
  start_date: z.string().optional().or(z.literal("")),
  valid_until: z.string().optional().or(z.literal("")),
  line_items: z.array(lineItemSchema).min(1, "Add at least one line item"),
});

type InquiryFormValues = z.infer<typeof inquiryFormSchema>;

function emptyFormValues(): InquiryFormValues {
  return {
    customer_id: "",
    title: "",
    description: "",
    start_date: "",
    valid_until: "",
    line_items: [{ description: "", quantity: 1, unit_price: 0, vat_rate: 23 }],
  };
}

function toFormValues(inquiry: Inquiry | null): InquiryFormValues {
  if (!inquiry) {
    return emptyFormValues();
  }

  return {
    customer_id: inquiry.customer_id,
    title: inquiry.title,
    description: inquiry.description ?? "",
    start_date: inquiry.start_date ?? "",
    valid_until: inquiry.valid_until ?? "",
    line_items: inquiry.line_items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      vat_rate: item.vat_rate,
    })),
  };
}

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value ?? 0);
}

function buildReference(inquiry: Inquiry) {
  const year = new Date(inquiry.created_at).getFullYear();
  return `INQ-${year}-${inquiry.id.slice(0, 4).toUpperCase()}`;
}

function lineItemsToPayload(items: InquiryFormValues["line_items"]): InquiryLineItemPayload[] {
  return items.map((item) => ({
    description: item.description.trim(),
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    vat_rate: Number(item.vat_rate),
  }));
}

export default function InquiriesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [selectedStatuses, setSelectedStatuses] = useState<InquiryStatus[]>(
    ((searchParams.get("status") ?? "").split(",").filter(Boolean) as InquiryStatus[]),
  );
  const [customerFilter, setCustomerFilter] = useState(searchParams.get("customer_id") ?? "all");
  const [dateFrom, setDateFrom] = useState(searchParams.get("from") ?? "");
  const [dateTo, setDateTo] = useState(searchParams.get("to") ?? "");
  const [page, setPage] = useState(Number(searchParams.get("page") ?? "1") || 1);
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingInquiry, setEditingInquiry] = useState<Inquiry | null>(null);

  const offset = Math.max(page - 1, 0) * pageSize;

  const customersQuery = useCustomers({ limit: 100, offset: 0, search: undefined });
  const inquiriesQuery = useInquiries({
    search: searchInput || undefined,
    status: selectedStatuses.length ? selectedStatuses.join(",") : undefined,
    customer_id: customerFilter !== "all" ? customerFilter : undefined,
    limit: pageSize,
    offset,
  });
  const detailQuery = useInquiry(selectedInquiryId);

  const createMutation = useCreateInquiry();
  const updateMutation = useUpdateInquiry();
  const deleteMutation = useDeleteInquiry();
  const sendMutation = useSendInquiry();
  const archiveMutation = useArchiveInquiry();
  const unarchiveMutation = useUnarchiveInquiry();
  const downloadPdfMutation = useDownloadInquiryQuotePdf();

  const form = useForm<InquiryFormValues>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: emptyFormValues(),
  });
  const lineItemsFieldArray = useFieldArray({ control: form.control, name: "line_items" });

  useEffect(() => {
    form.reset(toFormValues(editingInquiry));
  }, [editingInquiry, form]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (searchInput.trim()) {
        next.set("search", searchInput.trim());
      } else {
        next.delete("search");
      }
      if (selectedStatuses.length) {
        next.set("status", selectedStatuses.join(","));
      } else {
        next.delete("status");
      }
      if (customerFilter !== "all") {
        next.set("customer_id", customerFilter);
      } else {
        next.delete("customer_id");
      }
      if (dateFrom) {
        next.set("from", dateFrom);
      } else {
        next.delete("from");
      }
      if (dateTo) {
        next.set("to", dateTo);
      } else {
        next.delete("to");
      }
      next.set("page", String(page));
      setSearchParams(next, { replace: true });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [customerFilter, dateFrom, dateTo, page, searchInput, searchParams, selectedStatuses, setSearchParams]);

  const filteredItems = useMemo(() => {
    const items = inquiriesQuery.data?.items ?? [];
    return items.filter((item) => {
      const validUntil = item.valid_until ? new Date(item.valid_until) : null;
      const afterFrom = !dateFrom || (validUntil && validUntil >= new Date(dateFrom));
      const beforeTo = !dateTo || (validUntil && validUntil <= new Date(dateTo));
      return Boolean(afterFrom && beforeTo);
    });
  }, [dateFrom, dateTo, inquiriesQuery.data?.items]);

  const total = inquiriesQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const selectedInquiry = detailQuery.data ?? null;

  const formSubmit = form.handleSubmit(async (values) => {
    const payload: InquiryPayload = {
      customer_id: values.customer_id,
      title: values.title.trim(),
      description: values.description?.trim() || null,
      start_date: values.start_date || null,
      valid_until: values.valid_until || null,
      line_items: lineItemsToPayload(values.line_items),
    };

    try {
      if (editingInquiry) {
        await updateMutation.mutateAsync({ id: editingInquiry.id, payload });
        toast.success("Inquiry updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Inquiry created");
      }
      setFormOpen(false);
      setEditingInquiry(null);
      form.reset(emptyFormValues());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save inquiry");
    }
  });

  const handleToggleStatus = (status: InquiryStatus) => {
    setSelectedStatuses((current) =>
      current.includes(status) ? current.filter((item) => item !== status) : [...current, status],
    );
    setPage(1);
  };

  const openNewInquiry = () => {
    setEditingInquiry(null);
    setFormOpen(true);
  };

  const openEditInquiry = () => {
    if (!selectedInquiry) return;
    setEditingInquiry(selectedInquiry);
    setFormOpen(true);
  };

  const handleCopyShareLink = async () => {
    if (!selectedInquiry?.public_token) {
      return;
    }
    const shareUrl = `${window.location.origin}/q/${selectedInquiry.public_token}`;
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied");
  };

  const handleSend = async () => {
    if (!selectedInquiry) return;
    try {
      await sendMutation.mutateAsync({ id: selectedInquiry.id, validUntilOverride: selectedInquiry.valid_until });
      toast.success("Inquiry sent to client");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send inquiry");
    }
  };

  const handleArchive = async () => {
    if (!selectedInquiry) return;
    try {
      if (selectedInquiry.status === "archived") {
        await unarchiveMutation.mutateAsync(selectedInquiry.id);
        toast.success("Inquiry restored");
      } else {
        await archiveMutation.mutateAsync(selectedInquiry.id);
        toast.success("Inquiry archived");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update inquiry");
    }
  };

  const handleDelete = async () => {
    if (!selectedInquiry) return;
    try {
      await deleteMutation.mutateAsync(selectedInquiry.id);
      toast.success("Inquiry deleted");
      setSelectedInquiryId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete inquiry");
    }
  };

  const detailActionButtons = () => {
    if (!selectedInquiry) {
      return null;
    }

    switch (selectedInquiry.status) {
      case "draft":
        return (
          <>
            <Button variant="outline" onClick={openEditInquiry}>Edit</Button>
            <Button onClick={handleSend}><Send className="mr-2 h-4 w-4" />Send to client</Button>
            <Button variant="outline" onClick={handleDelete}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
          </>
        );
      case "sent":
        return (
          <>
            <Button variant="outline" onClick={handleCopyShareLink}><Copy className="mr-2 h-4 w-4" />Copy share link</Button>
            <Button variant="outline" onClick={() => downloadPdfMutation.mutate(selectedInquiry.id)}><Eye className="mr-2 h-4 w-4" />View quote PDF</Button>
            <Button variant="outline" onClick={handleArchive}><Archive className="mr-2 h-4 w-4" />Archive</Button>
          </>
        );
      case "accepted":
        return (
          <>
            <Button onClick={() => navigate("/invoices")}><FilePlus2 className="mr-2 h-4 w-4" />Create invoice</Button>
            <Button variant="outline" onClick={handleArchive}><Archive className="mr-2 h-4 w-4" />Archive</Button>
          </>
        );
      case "discussion_requested":
        return (
          <>
            <Button variant="outline" onClick={() => toast.info(selectedInquiry.client_notes[0]?.note ?? "No client note")}>View client note</Button>
            <Button onClick={openEditInquiry}><Mail className="mr-2 h-4 w-4" />Revise & re-send</Button>
            <Button variant="outline" onClick={handleArchive}><Archive className="mr-2 h-4 w-4" />Archive</Button>
          </>
        );
      case "rejected":
      case "expired":
        return <Button variant="outline" onClick={handleArchive}><Archive className="mr-2 h-4 w-4" />Archive</Button>;
      case "invoiced":
      case "completed":
        return (
          <>
            <Button onClick={() => navigate("/invoices")}><Eye className="mr-2 h-4 w-4" />View invoice</Button>
            <Button variant="outline" onClick={handleArchive}><Archive className="mr-2 h-4 w-4" />Archive</Button>
          </>
        );
      case "archived":
        return <Button variant="outline" onClick={handleArchive}>Restore</Button>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inquiries</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your quote pipeline from first draft through completion.
          </p>
        </div>
        <Button onClick={openNewInquiry} className="gap-2">
          <Plus className="h-4 w-4" />
          New Inquiry
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inquiry pipeline</CardTitle>
          <CardDescription>Filter by status, customer, date, or search term.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1.4fr,1fr,1fr,1fr]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => {
                  setSearchInput(event.target.value);
                  setPage(1);
                }}
                placeholder="Search title or customer"
                className="pl-9"
              />
            </div>

            <Select value={customerFilter} onValueChange={(value) => { setCustomerFilter(value); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All customers</SelectItem>
                {(customersQuery.data?.items ?? []).map((customer: Customer) => (
                  <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </div>

          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => (
              <Button
                key={status}
                size="sm"
                variant={selectedStatuses.includes(status) ? "secondary" : "outline"}
                onClick={() => handleToggleStatus(status)}
              >
                {status.replaceAll("_", " ")}
              </Button>
            ))}
          </div>

          {inquiriesQuery.isLoading ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
              Loading inquiries...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No inquiries match your current filters.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Quote amount</TableHead>
                      <TableHead>Valid until</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((inquiry) => (
                      <TableRow
                        key={inquiry.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedInquiryId(inquiry.id)}
                      >
                        <TableCell className="font-medium">{buildReference(inquiry)}</TableCell>
                        <TableCell>{inquiry.customer_name}</TableCell>
                        <TableCell><InquiryStatusBadge status={inquiry.status} /></TableCell>
                        <TableCell>{formatCurrency(inquiry.quote_amount ?? inquiry.total)}</TableCell>
                        <TableCell>{inquiry.valid_until ? format(new Date(inquiry.valid_until), "dd MMM yyyy") : "-"}</TableCell>
                        <TableCell>{format(new Date(inquiry.updated_at), "dd MMM yyyy")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Sheet open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) { setEditingInquiry(null); form.reset(emptyFormValues()); } }}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{editingInquiry ? "Edit inquiry" : "New inquiry"}</SheetTitle>
            <SheetDescription>Create or revise the working quote before sending it to the client.</SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={formSubmit} className="mt-6 space-y-5">
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(customersQuery.data?.items ?? []).map((customer: Customer) => (
                          <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input placeholder="Kitchen renovation — Galway project" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Full kitchen refurb, 4 weeks" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="start_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="valid_until" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid until</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Line items</h3>
                    <p className="text-sm text-muted-foreground">Build the editable working quote.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => lineItemsFieldArray.append({ description: "", quantity: 1, unit_price: 0, vat_rate: 23 })}
                  >
                    Add line
                  </Button>
                </div>

                {lineItemsFieldArray.fields.map((field, index) => (
                  <div key={field.id} className="rounded-xl border p-4">
                    <div className="grid gap-3 md:grid-cols-[2fr,1fr,1fr,1fr]">
                      <FormField control={form.control} name={`line_items.${index}.description`} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl><Input placeholder="Labour" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`line_items.${index}.quantity`} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`line_items.${index}.unit_price`} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit price</FormLabel>
                          <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`line_items.${index}.vat_rate`} render={({ field }) => (
                        <FormItem>
                          <FormLabel>VAT rate</FormLabel>
                          <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    {lineItemsFieldArray.fields.length > 1 ? (
                      <Button type="button" variant="ghost" className="mt-3 px-0 text-rose-600" onClick={() => lineItemsFieldArray.remove(index)}>
                        Remove line
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>

              <SheetFooter>
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingInquiry ? "Save inquiry" : "Create inquiry"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(selectedInquiryId)} onOpenChange={(open) => !open && setSelectedInquiryId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Inquiry detail</SheetTitle>
            <SheetDescription>Review status, share actions, line items, and activity.</SheetDescription>
          </SheetHeader>

          {detailQuery.isLoading || !selectedInquiry ? (
            <div className="mt-6 text-sm text-muted-foreground">Loading inquiry...</div>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{buildReference(selectedInquiry)}</p>
                    <h2 className="text-xl font-semibold">{selectedInquiry.title}</h2>
                  </div>
                  <InquiryStatusBadge status={selectedInquiry.status} />
                </div>
                <div className="flex flex-wrap gap-2">{detailActionButtons()}</div>
              </div>

              <Tabs defaultValue="details">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="line-items">Line items</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 rounded-xl border p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Customer</p>
                      <p className="font-medium">{selectedInquiry.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Quote amount</p>
                      <p className="font-medium">{formatCurrency(selectedInquiry.quote_amount ?? selectedInquiry.total)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valid until</p>
                      <p className="font-medium">{selectedInquiry.valid_until ? format(new Date(selectedInquiry.valid_until), "dd MMM yyyy") : "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Share URL</p>
                      <p className="font-medium break-all">{selectedInquiry.share_url ?? "Not sent yet"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{selectedInquiry.description || "No description provided."}</p>
                  </div>
                </TabsContent>

                <TabsContent value="line-items" className="rounded-xl border p-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit price</TableHead>
                        <TableHead>VAT</TableHead>
                        <TableHead>Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedInquiry.status === "draft" || selectedInquiry.status === "discussion_requested"
                        ? selectedInquiry.line_items
                        : selectedInquiry.quote_line_items
                      ).map((item, index) => (
                        <TableRow key={item.id ?? `${item.description}-${index}`}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell>{item.vat_rate}%</TableCell>
                          <TableCell>{formatCurrency(item.line_total_net + item.line_total_vat)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="activity" className="space-y-3 rounded-xl border p-4">
                  {selectedInquiry.audit_timeline.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No activity yet.</p>
                  ) : (
                    selectedInquiry.audit_timeline.map((entry) => (
                      <div key={`${entry.at}-${entry.action}`} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{entry.action.replaceAll(".", " ")}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(entry.at), "dd MMM yyyy HH:mm")}</p>
                        </div>
                        {entry.detail?.note ? (
                          <p className="mt-2 text-sm text-muted-foreground">{String(entry.detail.note)}</p>
                        ) : null}
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}