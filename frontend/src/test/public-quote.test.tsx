import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PublicQuotePage from "@/pages/PublicQuote";

const usePublicInquiryMock = vi.fn();
const usePublicAcceptInquiryMock = vi.fn();
const usePublicRejectInquiryMock = vi.fn();
const usePublicRequestDiscussionMock = vi.fn();

vi.mock("@/hooks/useInquiries", () => ({
  usePublicInquiry: (...args: unknown[]) => usePublicInquiryMock(...args),
  usePublicAcceptInquiry: (...args: unknown[]) => usePublicAcceptInquiryMock(...args),
  usePublicRejectInquiry: (...args: unknown[]) => usePublicRejectInquiryMock(...args),
  usePublicRequestDiscussion: (...args: unknown[]) => usePublicRequestDiscussionMock(...args),
}));

function renderPage() {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/q/public-token"]}>
        <Routes>
          <Route path="/q/:token" element={<PublicQuotePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  usePublicInquiryMock.mockReturnValue({
    data: {
      business_name: "Demo Consulting Ltd",
      business_address: "12 Grafton St, Dublin 2",
      customer_name: "O'Brien Plumbing Ltd",
      title: "Kitchen renovation — Galway project",
      line_items: [
        { description: "Labour", quantity: 80, unit_price: 45, vat_rate: 13.5, line_total_net: 3600, line_total_vat: 486 },
      ],
      subtotal: 3600,
      vat_total: 486,
      total: 4086,
      valid_until: "2026-05-24",
      status: "sent",
      available_actions: ["accept", "reject", "request_discussion"],
    },
    isLoading: false,
    isError: false,
  });
  usePublicAcceptInquiryMock.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({ status: "accepted", accepted_at: "2026-04-26T12:00:00Z", available_actions: [] }),
  });
  usePublicRejectInquiryMock.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({ status: "rejected", available_actions: [] }) });
  usePublicRequestDiscussionMock.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({ status: "discussion_requested", available_actions: ["accept", "reject"] }) });
});

describe("PublicQuotePage", () => {
  it("accepts the quote and updates the status panel", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /accept/i }));

    await waitFor(() => {
      expect(screen.getByText(/quote accepted on/i)).toBeInTheDocument();
    });
  });

  it("requires a note before requesting discussion", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /request discussion/i }));

    expect(await screen.findByText(/please add a note before requesting discussion/i)).toBeInTheDocument();
  });
});