import { MemoryRouter, Route, Routes } from "react-router-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuthContext } from "@/contexts/AuthContext";
import LoginPage from "@/pages/Login";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const authContextValue = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
};

describe("LoginPage", () => {
  it("renders fields, validates empty submit, and submits successfully", async () => {
    const loginMock = vi.fn().mockResolvedValue({
      access_token: "access-token",
      refresh_token: "refresh-token",
      token_type: "bearer",
      user: {
        id: "user-1",
        email: "demo@spendly.test",
        role: "self_employed_vat",
        business_name: "Demo Co",
      },
    });

    render(
      <AuthContext.Provider value={{ ...authContextValue, login: loginMock }}>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<div>Home Screen</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();

    fireEvent.input(screen.getByLabelText(/email/i), { target: { value: "demo@spendly.test" } });
    fireEvent.input(screen.getByLabelText(/^password$/i), { target: { value: "Demo1234!" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith("demo@spendly.test", "Demo1234!");
    });
  });
});

describe("ProtectedRoute", () => {
  it("redirects unauthenticated users to login", async () => {
    render(
      <AuthContext.Provider value={{ ...authContextValue }}>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Screen</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(await screen.findByText(/login screen/i)).toBeInTheDocument();
  });
});
