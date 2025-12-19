import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NavLink: React.FC<{ to: string; label: string }> = ({ to, label }) => {
  const loc = useLocation()
  const active = loc.pathname.startsWith(to)
  return (
    <Link
      className={`block px-4 py-2 rounded hover:bg-gray-200 transition ${active ? 'bg-gray-200 font-medium' : ''}`}
      to={to}
    >
      {label}
    </Link>
  )
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout } = useAuth()
  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      <aside className="bg-white border-r border-gray-200 p-4 flex flex-col gap-2">
        <div className="text-xl font-semibold mb-4">Spendly</div>
        <NavLink to="/dashboard" label="Dashboard" />
        <NavLink to="/inquiries" label="Inquiries" />
        <NavLink to="/receipts" label="Receipts & Expenses" />
        <NavLink to="/invoices" label="Invoices" />
        <NavLink to="/payments" label="Payments" />
        <NavLink to="/tax" label="Tax Summary" />
        <NavLink to="/insights" label="Insights" />
        <div className="flex-1" />
        <button className="btn" onClick={logout}>Logout</button>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  )
}

export default Layout
