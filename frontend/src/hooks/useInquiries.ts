import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  acceptPublicInquiry,
  archiveInquiry,
  createInquiry,
  deleteInquiry,
  downloadInquiryQuotePdf,
  getInquiry,
  getPublicInquiry,
  listInquiries,
  rejectPublicInquiry,
  requestPublicDiscussion,
  sendInquiry,
  unarchiveInquiry,
  updateInquiry,
} from "@/api/inquiries";
import type { InquiryFilters, InquiryPayload } from "@/types/api";

export function useInquiries(filters: InquiryFilters) {
  return useQuery({
    queryKey: ["inquiries", filters],
    queryFn: () => listInquiries(filters),
  });
}

export function useInquiry(inquiryId: string | null) {
  return useQuery({
    queryKey: ["inquiries", inquiryId],
    queryFn: () => getInquiry(inquiryId as string),
    enabled: Boolean(inquiryId),
  });
}

export function useCreateInquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InquiryPayload) => createInquiry(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["inquiries"] });
    },
  });
}

export function useUpdateInquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<InquiryPayload> }) => updateInquiry(id, payload),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      await queryClient.invalidateQueries({ queryKey: ["inquiries", variables.id] });
    },
  });
}

export function useDeleteInquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteInquiry(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["inquiries"] });
    },
  });
}

export function useSendInquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, validUntilOverride }: { id: string; validUntilOverride?: string | null }) =>
      sendInquiry(id, validUntilOverride),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      await queryClient.invalidateQueries({ queryKey: ["inquiries", variables.id] });
    },
  });
}

export function useArchiveInquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveInquiry(id),
    onSuccess: async (_, id) => {
      await queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      await queryClient.invalidateQueries({ queryKey: ["inquiries", id] });
    },
  });
}

export function useUnarchiveInquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => unarchiveInquiry(id),
    onSuccess: async (_, id) => {
      await queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      await queryClient.invalidateQueries({ queryKey: ["inquiries", id] });
    },
  });
}

export function useDownloadInquiryQuotePdf() {
  return useMutation({
    mutationFn: (id: string) => downloadInquiryQuotePdf(id),
  });
}

export function usePublicInquiry(token: string | undefined) {
  return useQuery({
    queryKey: ["public-inquiry", token],
    queryFn: () => getPublicInquiry(token as string),
    enabled: Boolean(token),
  });
}

export function usePublicAcceptInquiry(token: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => acceptPublicInquiry(token as string),
    onSuccess: async (data) => {
      await queryClient.setQueryData(["public-inquiry", token], (previous: any) =>
        previous ? { ...previous, ...data, status: data.status, available_actions: data.available_actions } : previous,
      );
    },
  });
}

export function usePublicRejectInquiry(token: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reason?: string) => rejectPublicInquiry(token as string, reason),
    onSuccess: async (data) => {
      await queryClient.setQueryData(["public-inquiry", token], (previous: any) =>
        previous ? { ...previous, ...data, status: data.status, available_actions: data.available_actions } : previous,
      );
    },
  });
}

export function usePublicRequestDiscussion(token: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (note: string) => requestPublicDiscussion(token as string, note),
    onSuccess: async (data) => {
      await queryClient.setQueryData(["public-inquiry", token], (previous: any) =>
        previous ? { ...previous, ...data, status: data.status, available_actions: data.available_actions } : previous,
      );
    },
  });
}