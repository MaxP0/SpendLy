import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import InvoicesPage, { computeTotals } from "@/pages/Invoices";

const useAuthMock = vi.fn();
const useCustomersMock = vi.fn();
const useInquiriesMock = vi.fn();
const useInvoicesMock = vi.fn();
const useInvoiceMock = vi.fn();
const useCreateInvoiceMock = vi.fn();
const useUpdateInvoiceMock = vi.fn();
const useIssueInvoiceMock = vi.fn();
const useCancelInvoiceMock = vi.fn();
const useDownloadInvoicePdfMock = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/hooks/useCustomers", () => ({
  useCustomers: (...args: unknown[]) => useCustomersMock(...args),
}));

vi.mock("@/hooks/useInquiries", () => ({
  useInquiries: (...args: unknown[]) => useInquiriesMock(...args),
}));

vi.mock("@/hooks/useInvoices", () => ({
  useInvoices: (...args: unknown[]) => useInvoicesMock(...args),
  useInvoice: (...args: unknown[]) => useInvoiceMock(...args),
  useCreateInvoice: () => useCreateInvoiceMock(),
  useUpdateInvoice: () => useUpdateInvoiceMock(),
  useIssueInvoice: () => useIssueInvoiceMock(),
  useCancelInvoice: () => useCancelInvoiceMock(),
  useDownloadInvoicePdf: () => useDownloadInvoicePdfMock(),
}));

function renderPage() {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/invoices"]}>
        <InvoicesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  Object.assign(globalThis, { ResizeObserver: ResizeObserverMock });

  useAuthMock.mockReturnValue({ user: { role: "self_employed_vat" } });
  useCustomersMock.mockReturnValue({ data: { items: [{ id: "c1", name: "O'Brien Plumbing Ltd", email: null, phone: null, address: null, created_at: "", updated_at: "" }], total: 1, limit: 100, offset: 0 } });
  useInquiriesMock.mockReturnValue({ data: { items: [], total: 0, limit: 100, offset: 0 } });
  useInvoicesMock.mockReturnValue({ data: { items: [], total: 0, limit: 20, offset: 0 }, isLoading: false });
  useInvoiceMock.mockReturnValue({ data: null, isLoading: false });
  useCreateInvoiceMock.mockReturnValue({ mutateAsync: vi.fn() });
  useUpdateInvoiceMock.mockReturnValue({ mutateAsync: vi.fn() });
  useIssueInvoiceMock.mockReturnValue({ mutateAsync: vi.fn() });
  useCancelInvoiceMock.mockReturnValue({ mutateAsync: vi.fn() });
  useDownloadInvoicePdfMock.mockReturnValue({ mutateAsync: vi.fn() });
});

describe("InvoicesPage", () => {
  it("adds and removes line items while using the shared total calculator", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /new invoice/i }));

    expect(screen.getAllByTestId(/line-item-unit-price-/)).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /add line item/i }));

    expect(screen.getAllByTestId(/line-item-unit-price-/)).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: /remove line item 2/i }));

    expect(screen.getAllByTestId(/line-item-unit-price-/)).toHaveLength(1);

    expect(
      computeTotals(
        [
          { description: "Consulting hours", quantity: 10, unit_price: 120, vat_rate: 23 },
          { description: "Travel expenses", quantity: 1, unit_price: 50, vat_rate: 13.5 },
        ],
        true,
      ),
    ).toMatchObject({ subtotal: 1250, vatTotal: 282.75, total: 1532.75 });
  });

  it("hides the VAT rate field for non-VAT users", () => {
    useAuthMock.mockReturnValue({ user: { role: "self_employed_no_vat" } });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /new invoice/i }));

    expect(screen.queryByText(/vat rate/i)).not.toBeInTheDocument();
    expect(screen.getByText(/vat not applicable/i)).toBeInTheDocument();
  });

  it("hides the linked inquiry select when standalone is checked", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /new invoice/i }));

    expect(screen.getByTestId("linked-inquiry-field")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox"));

    expect(screen.queryByTestId("linked-inquiry-field")).not.toBeInTheDocument();
  });
});