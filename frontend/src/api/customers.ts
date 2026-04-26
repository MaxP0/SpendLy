import axios from "axios";

import { apiClient } from "./client";
import type { Customer, CustomerListResponse, CustomerPayload } from "@/types/api";

interface ListCustomersParams {
  search?: string;
  limit?: number;
  offset?: number;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") {
      return detail;
    }
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export async function listCustomers(params: ListCustomersParams): Promise<CustomerListResponse> {
  try {
    const response = await apiClient.get<CustomerListResponse>("/customers", { params });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to load customers"));
  }
}

export async function getCustomer(id: string): Promise<Customer> {
  try {
    const response = await apiClient.get<Customer>(`/customers/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to load customer"));
  }
}

export async function createCustomer(data: CustomerPayload): Promise<Customer> {
  try {
    const response = await apiClient.post<Customer>("/customers", data);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to create customer"));
  }
}

export async function updateCustomer(id: string, data: CustomerPayload): Promise<Customer> {
  try {
    const response = await apiClient.put<Customer>(`/customers/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to update customer"));
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  try {
    await apiClient.delete(`/customers/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to delete customer"));
  }
}