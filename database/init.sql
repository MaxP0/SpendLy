"""Database initialization script.

This file contains the SQL schema for Spendly database.
Use this as a reference for manual database creation.
In production, use Alembic migrations instead.
"""

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    business_name VARCHAR(255),
    business_address TEXT,
    gdpr_consent_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_email (email)
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_customers_user_id (user_id)
);

-- Inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    INDEX idx_inquiries_user_id (user_id),
    INDEX idx_inquiries_customer_id (customer_id)
);

-- Receipts table
CREATE TABLE IF NOT EXISTS receipts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    inquiry_id VARCHAR(36),
    file_path VARCHAR(500) NOT NULL,
    ocr_raw_text TEXT,
    ocr_confidence FLOAT,
    merchant VARCHAR(255),
    date TIMESTAMP,
    amount FLOAT,
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    vat_amount FLOAT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (inquiry_id) REFERENCES inquiries(id),
    INDEX idx_receipts_user_id (user_id),
    INDEX idx_receipts_inquiry_id (inquiry_id)
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(36) PRIMARY KEY,
    receipt_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    inquiry_id VARCHAR(36),
    amount FLOAT NOT NULL,
    vat_amount FLOAT,
    ml_suggested_category VARCHAR(255),
    ml_confidence FLOAT,
    user_confirmed_category VARCHAR(255),
    is_vat_reclaimable BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receipt_id) REFERENCES receipts(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (inquiry_id) REFERENCES inquiries(id),
    INDEX idx_expenses_user_id (user_id),
    INDEX idx_expenses_receipt_id (receipt_id),
    INDEX idx_expenses_inquiry_id (inquiry_id)
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    inquiry_id VARCHAR(36),
    customer_id VARCHAR(36) NOT NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    subtotal FLOAT NOT NULL,
    vat_rate FLOAT NOT NULL DEFAULT 0.0,
    vat_amount FLOAT NOT NULL DEFAULT 0.0,
    total FLOAT NOT NULL,
    issued_at TIMESTAMP,
    due_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (inquiry_id) REFERENCES inquiries(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    INDEX idx_invoices_user_id (user_id),
    INDEX idx_invoices_invoice_number (invoice_number)
);

-- Bank Transactions table
CREATE TABLE IF NOT EXISTS bank_transactions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    date TIMESTAMP NOT NULL,
    amount FLOAT NOT NULL,
    description VARCHAR(500),
    reconciliation_status VARCHAR(50) NOT NULL DEFAULT 'unmatched',
    is_immutable BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_transactions_user_id (user_id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    amount FLOAT NOT NULL,
    payment_date TIMESTAMP NOT NULL,
    transaction_id VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (transaction_id) REFERENCES bank_transactions(id),
    INDEX idx_payments_user_id (user_id),
    INDEX idx_payments_invoice_id (invoice_id),
    INDEX idx_payments_transaction_id (transaction_id)
);

-- Tax Summaries table
CREATE TABLE IF NOT EXISTS tax_summaries (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    summary_type VARCHAR(50) NOT NULL,
    total_income FLOAT NOT NULL DEFAULT 0.0,
    total_expenses FLOAT NOT NULL DEFAULT 0.0,
    vat_collected FLOAT NOT NULL DEFAULT 0.0,
    vat_reclaimable FLOAT NOT NULL DEFAULT 0.0,
    vat_due FLOAT NOT NULL DEFAULT 0.0,
    taxable_income FLOAT NOT NULL DEFAULT 0.0,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    generated_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_tax_summaries_user_id (user_id)
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(36) NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_value JSON,
    new_value JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_audit_logs_user_id (user_id)
);
