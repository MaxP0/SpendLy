import axios from "axios";

import { apiClient } from "./client";
import type { Invoice, InvoiceFilters, InvoiceListResponse, InvoicePayload } from "@/types/api";

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

function getFileName(dispositionHeader: string | undefined, fallback: string) {
  const match = dispositionHeader?.match(/filename=\"?([^\"]+)\"?/i);
  return match?.[1] ?? fallback;
}

export async function listInvoices(filters: InvoiceFilters): Promise<InvoiceListResponse> {
  try {
    const response = await apiClient.get<InvoiceListResponse>("/invoices", { params: filters });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to load invoices"));
  }
}

export async function getInvoice(id: string): Promise<Invoice> {
  try {
    const response = await apiClient.get<Invoice>(`/invoices/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to load invoice"));
  }
}

export async function createInvoice(payload: InvoicePayload): Promise<Invoice> {
  try {
    const response = await apiClient.post<Invoice>("/invoices", payload);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to create invoice"));
  }
}

export async function updateInvoice(id: string, payload: InvoicePayload): Promise<Invoice> {
  try {
    const response = await apiClient.put<Invoice>(`/invoices/${id}`, payload);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to update invoice"));
  }
}

export async function issueInvoice(id: string): Promise<Invoice> {
  try {
    const response = await apiClient.post<Invoice>(`/invoices/${id}/issue`, {});
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to issue invoice"));
  }
}

export async function cancelInvoice(id: string): Promise<Invoice> {
  try {
    const response = await apiClient.post<Invoice>(`/invoices/${id}/cancel`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to cancel invoice"));
  }
}

export async function downloadInvoicePdf(id: string): Promise<void> {
  try {
    const response = await apiClient.get<Blob>(`/invoices/${id}/pdf`, { responseType: "blob" });
    const objectUrl = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = getFileName(response.headers["content-disposition"], `invoice-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to download invoice PDF"));
  }
}