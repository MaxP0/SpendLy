import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CustomersPage from "@/pages/Customers";

const useCustomersMock = vi.fn();
const useCreateCustomerMock = vi.fn();
const useUpdateCustomerMock = vi.fn();
const useDeleteCustomerMock = vi.fn();

vi.mock("@/hooks/useCustomers", () => ({
  useCustomers: (...args: unknown[]) => useCustomersMock(...args),
  useCreateCustomer: () => useCreateCustomerMock(),
  useUpdateCustomer: () => useUpdateCustomerMock(),
  useDeleteCustomer: () => useDeleteCustomerMock(),
}));

function renderPage() {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/customers"]}>
        <CustomersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useCreateCustomerMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  useUpdateCustomerMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  useDeleteCustomerMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
});

describe("CustomersPage", () => {
  it("renders the empty state when no customers are returned", () => {
    useCustomersMock.mockReturnValue({
      data: { items: [], total: 0, limit: 20, offset: 0 },
      isLoading: false,
    });

    renderPage();

    expect(screen.getByText(/no customers yet/i)).toBeInTheDocument();
  });

  it("renders the customer table when data exists", () => {
    useCustomersMock.mockReturnValue({
      data: {
        items: [
          {
            id: "customer-1",
            name: "O'Brien Plumbing Ltd",
            email: "invoices@obrien.ie",
            phone: "+353 1 234 5678",
            address: "5 Camden St, Dublin 2",
            created_at: "2026-04-24T10:30:00Z",
            updated_at: "2026-04-24T10:30:00Z",
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
      },
      isLoading: false,
    });

    renderPage();

    expect(screen.getByText("O'Brien Plumbing Ltd")).toBeInTheDocument();
    expect(screen.getByText("invoices@obrien.ie")).toBeInTheDocument();
  });

  it("opens the drawer when add customer is clicked", () => {
    useCustomersMock.mockReturnValue({
      data: { items: [], total: 0, limit: 20, offset: 0 },
      isLoading: false,
    });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /add customer/i }));

    expect(screen.getByText(/create a customer record/i)).toBeInTheDocument();
  });
});