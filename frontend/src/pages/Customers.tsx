import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Edit3, Plus, Search, Trash2, Users } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from "@/hooks/useCustomers";
import type { Customer, CustomerPayload } from "@/types/api";

const pageSize = 20;

const customerFormSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required"),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || z.string().email().safeParse(value).success, "Enter a valid email address"),
  phone: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

function toFormValues(customer: Customer | null): CustomerFormValues {
  return {
    name: customer?.name ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
    address: customer?.address ?? "",
  };
}

export default function CustomersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";
  const initialPage = Number(searchParams.get("page") ?? "1") || 1;

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [page, setPage] = useState(Math.max(initialPage, 1));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  const offset = (page - 1) * pageSize;

  const customersQuery = useCustomers({
    search: initialSearch || undefined,
    limit: pageSize,
    offset,
  });
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: toFormValues(null),
  });

  useEffect(() => {
    form.reset(toFormValues(editingCustomer));
  }, [editingCustomer, form]);

  useEffect(() => {
    setSearchInput(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (searchInput.trim()) {
        next.set("search", searchInput.trim());
      } else {
        next.delete("search");
      }
      next.set("page", "1");
      setPage(1);
      setSearchParams(next, { replace: true });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput, searchParams, setSearchParams]);

  const total = customersQuery.data?.total ?? 0;
  const items = customersQuery.data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const openCreateSheet = () => {
    setEditingCustomer(null);
    setSheetOpen(true);
  };

  const openEditSheet = (customer: Customer) => {
    setEditingCustomer(customer);
    setSheetOpen(true);
  };

  const handlePageChange = (nextPage: number) => {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);
    setPage(safePage);
    const next = new URLSearchParams(searchParams);
    next.set("page", String(safePage));
    setSearchParams(next, { replace: true });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const payload: CustomerPayload = {
      name: values.name.trim(),
      email: values.email?.trim() || null,
      phone: values.phone?.trim() || null,
      address: values.address?.trim() || null,
    };

    try {
      if (editingCustomer) {
        await updateMutation.mutateAsync({ id: editingCustomer.id, payload });
        toast.success("Customer updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Customer created");
      }
      setSheetOpen(false);
      setEditingCustomer(null);
      form.reset(toFormValues(null));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save customer");
    }
  });

  const handleDelete = async () => {
    if (!deletingCustomer) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(deletingCustomer.id);
      toast.success("Customer deleted");
      setDeletingCustomer(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete customer";
      if (message === "Customer has invoices") {
        toast.error("Cannot delete — customer has invoices.");
      } else {
        toast.error(message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the people and businesses you invoice.
          </p>
        </div>
        <Button onClick={openCreateSheet} className="gap-2" aria-label="Add Customer">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Customer directory</CardTitle>
            <CardDescription>
              Search, update, and remove your customer records.
            </CardDescription>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search customers"
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {customersQuery.isLoading ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
              Loading customers...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-base font-medium">No customers yet. Add your first customer to start invoicing.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.email ?? "-"}</TableCell>
                      <TableCell>{customer.phone ?? "-"}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditSheet(customer)}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setDeletingCustomer(customer)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {Math.min(offset + 1, total)} to {Math.min(offset + items.length, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(page - 1)} disabled={page <= 1}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setEditingCustomer(null);
            form.reset(toFormValues(null));
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingCustomer ? "Edit customer" : "Add customer"}</SheetTitle>
            <SheetDescription>
              {editingCustomer ? "Update the customer's contact details." : "Create a customer record for future invoices."}
            </SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={onSubmit} className="mt-6 flex h-full flex-col gap-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="O'Brien Plumbing Ltd" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="invoices@obrien.ie" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+353 1 234 5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="5 Camden St, Dublin 2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SheetFooter className="mt-auto pt-4">
                <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingCustomer ? "Save changes" : "Create customer"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={Boolean(deletingCustomer)} onOpenChange={(open) => !open && setDeletingCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deletingCustomer?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}