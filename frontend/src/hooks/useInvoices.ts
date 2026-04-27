import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cancelInvoice,
  createInvoice,
  downloadInvoicePdf,
  getInvoice,
  issueInvoice,
  listInvoices,
  updateInvoice,
} from "@/api/invoices";
import type { InvoiceFilters, InvoicePayload } from "@/types/api";

export function useInvoices(filters: InvoiceFilters) {
  return useQuery({
    queryKey: ["invoices", filters],
    queryFn: () => listInvoices(filters),
  });
}

export function useInvoice(invoiceId: string | null) {
  return useQuery({
    queryKey: ["invoices", invoiceId],
    queryFn: () => getInvoice(invoiceId as string),
    enabled: Boolean(invoiceId),
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InvoicePayload) => createInvoice(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: InvoicePayload }) => updateInvoice(id, payload),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      await queryClient.invalidateQueries({ queryKey: ["invoices", variables.id] });
    },
  });
}

export function useIssueInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => issueInvoice(id),
    onSuccess: async (_, id) => {
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      await queryClient.invalidateQueries({ queryKey: ["invoices", id] });
      await queryClient.invalidateQueries({ queryKey: ["inquiries"] });
    },
  });
}

export function useCancelInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelInvoice(id),
    onSuccess: async (_, id) => {
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      await queryClient.invalidateQueries({ queryKey: ["invoices", id] });
    },
  });
}

export function useDownloadInvoicePdf() {
  return useMutation({
    mutationFn: (id: string) => downloadInvoicePdf(id),
  });
}