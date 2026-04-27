import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import InquiriesPage from "@/pages/Inquiries";

const useCustomersMock = vi.fn();
const useInquiriesMock = vi.fn();
const useInquiryMock = vi.fn();
const useCreateInquiryMock = vi.fn();
const useUpdateInquiryMock = vi.fn();
const useDeleteInquiryMock = vi.fn();
const useSendInquiryMock = vi.fn();
const useArchiveInquiryMock = vi.fn();
const useUnarchiveInquiryMock = vi.fn();
const useDownloadInquiryQuotePdfMock = vi.fn();

vi.mock("@/hooks/useCustomers", () => ({
  useCustomers: (...args: unknown[]) => useCustomersMock(...args),
}));

vi.mock("@/hooks/useInquiries", () => ({
  useInquiries: (...args: unknown[]) => useInquiriesMock(...args),
  useInquiry: (...args: unknown[]) => useInquiryMock(...args),
  useCreateInquiry: () => useCreateInquiryMock(),
  useUpdateInquiry: () => useUpdateInquiryMock(),
  useDeleteInquiry: () => useDeleteInquiryMock(),
  useSendInquiry: () => useSendInquiryMock(),
  useArchiveInquiry: () => useArchiveInquiryMock(),
  useUnarchiveInquiry: () => useUnarchiveInquiryMock(),
  useDownloadInquiryQuotePdf: () => useDownloadInquiryQuotePdfMock(),
}));

function renderPage() {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/inquiries"]}>
        <InquiriesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });

  useCustomersMock.mockReturnValue({ data: { items: [], total: 0, limit: 100, offset: 0 } });
  useInquiriesMock.mockReturnValue({ data: { items: [], total: 0, limit: 20, offset: 0 }, isLoading: false });
  useInquiryMock.mockReturnValue({ data: null, isLoading: false });
  useCreateInquiryMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  useUpdateInquiryMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  useDeleteInquiryMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  useSendInquiryMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  useArchiveInquiryMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  useUnarchiveInquiryMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  useDownloadInquiryQuotePdfMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
});

describe("InquiriesPage", () => {
  it("renders the configured status badge colours", () => {
    useInquiriesMock.mockReturnValue({
      data: {
        items: [
          { id: "1", status: "draft", customer_id: "c1", customer_name: "A", title: "Draft", description: null, start_date: null, line_items: [], subtotal: 0, vat_total: 0, total: 0, quote_amount: null, quote_line_items: [], public_token: null, share_url: null, valid_until: null, sent_at: null, accepted_at: null, rejected_at: null, discussion_requested_at: null, client_notes: [], audit_timeline: [], related_invoices: [], created_at: "2026-04-26T10:00:00Z", updated_at: "2026-04-26T10:00:00Z" },
          { id: "2", status: "sent", customer_id: "c2", customer_name: "B", title: "Sent", description: null, start_date: null, line_items: [], subtotal: 0, vat_total: 0, total: 0, quote_amount: 200, quote_line_items: [], public_token: "tok", share_url: "http://localhost:5173/q/tok", valid_until: "2026-05-01", sent_at: "2026-04-26T10:00:00Z", accepted_at: null, rejected_at: null, discussion_requested_at: null, client_notes: [], audit_timeline: [], related_invoices: [], created_at: "2026-04-26T10:00:00Z", updated_at: "2026-04-26T10:00:00Z" },
          { id: "3", status: "accepted", customer_id: "c3", customer_name: "C", title: "Accepted", description: null, start_date: null, line_items: [], subtotal: 0, vat_total: 0, total: 0, quote_amount: 300, quote_line_items: [], public_token: "tok2", share_url: null, valid_until: null, sent_at: null, accepted_at: "2026-04-26T10:00:00Z", rejected_at: null, discussion_requested_at: null, client_notes: [], audit_timeline: [], related_invoices: [], created_at: "2026-04-26T10:00:00Z", updated_at: "2026-04-26T10:00:00Z" },
        ],
        total: 3,
        limit: 20,
        offset: 0,
      },
      isLoading: false,
    });

    renderPage();

    expect(screen.getByText("Draft").className).toContain("bg-slate-100");
    expect(screen.getByText("Sent").className).toContain("bg-sky-100");
    expect(screen.getByText("Accepted").className).toContain("bg-green-100");
  });

  it("copies the share link from the detail drawer", async () => {
    useInquiriesMock.mockReturnValue({
      data: {
        items: [
          { id: "sent-1", status: "sent", customer_id: "c1", customer_name: "O'Brien Plumbing Ltd", title: "Kitchen renovation", description: null, start_date: null, line_items: [], subtotal: 0, vat_total: 0, total: 0, quote_amount: 7161, quote_line_items: [], public_token: "public-token-1", share_url: "http://localhost:5173/q/public-token-1", valid_until: "2026-05-24", sent_at: "2026-04-24T12:00:00Z", accepted_at: null, rejected_at: null, discussion_requested_at: null, client_notes: [], audit_timeline: [], related_invoices: [], created_at: "2026-04-24T12:00:00Z", updated_at: "2026-04-24T12:00:00Z" },
        ],
        total: 1,
        limit: 20,
        offset: 0,
      },
      isLoading: false,
    });
    useInquiryMock.mockReturnValue({
      data: {
        id: "sent-1", status: "sent", customer_id: "c1", customer_name: "O'Brien Plumbing Ltd", title: "Kitchen renovation", description: null, start_date: null, line_items: [], subtotal: 6100, vat_total: 1061, total: 7161, quote_amount: 7161, quote_line_items: [], public_token: "public-token-1", share_url: "http://localhost:5173/q/public-token-1", valid_until: "2026-05-24", sent_at: "2026-04-24T12:00:00Z", accepted_at: null, rejected_at: null, discussion_requested_at: null, client_notes: [], audit_timeline: [], related_invoices: [], created_at: "2026-04-24T12:00:00Z", updated_at: "2026-04-24T12:00:00Z",
      },
      isLoading: false,
    });

    renderPage();

    fireEvent.click(screen.getByText(/o'brien plumbing ltd/i));
    fireEvent.click(screen.getByRole("button", { name: /copy share link/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(`${window.location.origin}/q/public-token-1`);
  });
});