export type UserRole = "self_employed_vat" | "self_employed_no_vat" | "paye_side_income";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  business_name: string | null;
}

export interface User extends AuthUser {
  business_address: string | null;
  gdpr_consent_at: string | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: UserRole;
  business_name?: string | null;
  business_address?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  user: AuthUser;
}

export interface RefreshResponse {
  access_token: string;
  token_type: "bearer";
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerListResponse {
  items: Customer[];
  total: number;
  limit: number;
  offset: number;
}

export interface CustomerPayload {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export type InquiryStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "discussion_requested"
  | "expired"
  | "invoiced"
  | "completed"
  | "archived";

export interface InquiryLineItemPayload {
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
}

export interface InquiryLineItem extends InquiryLineItemPayload {
  id?: string | null;
  line_total_net: number;
  line_total_vat: number;
}

export interface InquiryNote {
  at: string;
  note: string;
  source: "client" | "entrepreneur";
}

export interface InquiryAuditEntry {
  at: string;
  action: string;
  detail?: Record<string, unknown> | null;
  source: "system" | "client";
}

export interface InquiryRelatedInvoice {
  id: string;
  invoice_number: string;
  status: string;
  total: number;
}

export interface EmailStub {
  to: string | null;
  delivered: boolean;
  note: string;
}

export interface Inquiry {
  id: string;
  status: InquiryStatus;
  customer_id: string;
  customer_name: string;
  title: string;
  description: string | null;
  start_date: string | null;
  line_items: InquiryLineItem[];
  subtotal: number;
  vat_total: number;
  total: number;
  quote_amount: number | null;
  quote_line_items: InquiryLineItem[];
  public_token: string | null;
  share_url: string | null;
  valid_until: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  discussion_requested_at: string | null;
  client_notes: InquiryNote[];
  audit_timeline: InquiryAuditEntry[];
  related_invoices: InquiryRelatedInvoice[];
  email_stub?: EmailStub | null;
  created_at: string;
  updated_at: string;
}

export interface InquiryListResponse {
  items: Inquiry[];
  total: number;
  limit: number;
  offset: number;
}

export interface InquiryPayload {
  customer_id: string;
  title: string;
  description?: string | null;
  start_date?: string | null;
  valid_until?: string | null;
  line_items: InquiryLineItemPayload[];
}

export interface InquiryFilters {
  status?: string;
  customer_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PublicInquiry {
  business_name: string | null;
  business_address: string | null;
  customer_name: string;
  title: string;
  line_items: InquiryLineItem[];
  subtotal: number;
  vat_total: number;
  total: number;
  valid_until: string | null;
  status: InquiryStatus;
  available_actions: string[];
  accepted_at?: string | null;
  rejected_at?: string | null;
  discussion_requested_at?: string | null;
}

export interface PublicInquiryActionResponse {
  status: InquiryStatus;
  available_actions: string[];
  accepted_at?: string | null;
  rejected_at?: string | null;
  discussion_requested_at?: string | null;
}
