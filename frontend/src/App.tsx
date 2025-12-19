import React from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Receipts from './pages/Receipts'
import Placeholder from './pages/Placeholder'

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Navigate to="/dashboard" replace />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/receipts"
        element={
          <ProtectedRoute>
            <Layout>
              <Receipts />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inquiries"
        element={
          <ProtectedRoute>
            <Layout>
              <Placeholder
                title="Inquiries"
                description="This module will handle client inquiries and job tracking."
              />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices"
        element={
          <ProtectedRoute>
            <Layout>
              <Placeholder
                title="Invoices"
                description="Invoices page will allow users to create VAT and non-VAT invoices linked to inquiries."
              />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <Layout>
              <Placeholder
                title="Payments"
                description="Payments page will track incoming and outgoing payments across accounts."
              />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tax"
        element={
          <ProtectedRoute>
            <Layout>
              <Placeholder
                title="Tax Summary"
                description="Tax summary will show VAT returns and income tax estimates."
              />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/insights"
        element={
          <ProtectedRoute>
            <Layout>
              <Placeholder
                title="Insights"
                description="Insights will provide trends and basic analytics of business performance."
              />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
