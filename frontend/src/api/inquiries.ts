import axios from "axios";

import { apiClient } from "./client";
import type {
  Inquiry,
  InquiryFilters,
  InquiryListResponse,
  InquiryPayload,
  PublicInquiry,
  PublicInquiryActionResponse,
} from "@/types/api";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

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

export async function listInquiries(filters: InquiryFilters): Promise<InquiryListResponse> {
  try {
    const response = await apiClient.get<InquiryListResponse>("/inquiries", { params: filters });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to load inquiries"));
  }
}

export async function getInquiry(id: string): Promise<Inquiry> {
  try {
    const response = await apiClient.get<Inquiry>(`/inquiries/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to load inquiry"));
  }
}

export async function createInquiry(payload: InquiryPayload): Promise<Inquiry> {
  try {
    const response = await apiClient.post<Inquiry>("/inquiries", payload);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to create inquiry"));
  }
}

export async function updateInquiry(id: string, payload: Partial<InquiryPayload>): Promise<Inquiry> {
  try {
    const response = await apiClient.put<Inquiry>(`/inquiries/${id}`, payload);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to update inquiry"));
  }
}

export async function deleteInquiry(id: string): Promise<void> {
  try {
    await apiClient.delete(`/inquiries/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to delete inquiry"));
  }
}

export async function sendInquiry(id: string, validUntilOverride?: string | null): Promise<Inquiry> {
  try {
    const response = await apiClient.post<Inquiry>(`/inquiries/${id}/send`, {
      valid_until_override: validUntilOverride || undefined,
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to send inquiry"));
  }
}

export async function archiveInquiry(id: string): Promise<Inquiry> {
  try {
    const response = await apiClient.post<Inquiry>(`/inquiries/${id}/archive`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to archive inquiry"));
  }
}

export async function unarchiveInquiry(id: string): Promise<Inquiry> {
  try {
    const response = await apiClient.post<Inquiry>(`/inquiries/${id}/unarchive`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to restore inquiry"));
  }
}

export async function downloadInquiryQuotePdf(id: string): Promise<void> {
  try {
    const response = await apiClient.get<Blob>(`/inquiries/${id}/quote-pdf`, { responseType: "blob" });
    const objectUrl = window.URL.createObjectURL(response.data);
    window.open(objectUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to download quote PDF"));
  }
}

export async function getPublicInquiry(token: string): Promise<PublicInquiry> {
  try {
    const response = await axios.get<PublicInquiry>(`${apiBaseUrl}/public/inquiries/${token}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to load quote"));
  }
}

export async function acceptPublicInquiry(token: string): Promise<PublicInquiryActionResponse> {
  try {
    const response = await axios.post<PublicInquiryActionResponse>(`${apiBaseUrl}/public/inquiries/${token}/accept`, {});
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to accept quote"));
  }
}

export async function rejectPublicInquiry(token: string, reason?: string): Promise<PublicInquiryActionResponse> {
  try {
    const response = await axios.post<PublicInquiryActionResponse>(`${apiBaseUrl}/public/inquiries/${token}/reject`, {
      reason: reason || undefined,
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to reject quote"));
  }
}

export async function requestPublicDiscussion(token: string, note: string): Promise<PublicInquiryActionResponse> {
  try {
    const response = await axios.post<PublicInquiryActionResponse>(
      `${apiBaseUrl}/public/inquiries/${token}/request-discussion`,
      { note },
    );
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to request discussion"));
  }
}