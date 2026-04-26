import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} from "@/api/customers";
import type { CustomerPayload } from "@/types/api";

interface UseCustomersParams {
  search?: string;
  limit: number;
  offset: number;
}

export function useCustomers(params: UseCustomersParams) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => listCustomers(params),
  });
}

export function useCustomer(customerId: string | null) {
  return useQuery({
    queryKey: ["customers", customerId],
    queryFn: () => getCustomer(customerId as string),
    enabled: Boolean(customerId),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CustomerPayload) => createCustomer(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CustomerPayload }) => updateCustomer(id, payload),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      await queryClient.invalidateQueries({ queryKey: ["customers", variables.id] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}