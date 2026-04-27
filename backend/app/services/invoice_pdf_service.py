from __future__ import annotations

from html import escape


class InvoicePDFService:
    """Generates invoice PDFs from an HTML template."""

    def generate_invoice_pdf(
        self,
        *,
        business_name: str | None,
        business_address: str | None,
        invoice_number: str | None,
        status: str,
        issued_at: str | None,
        due_at: str | None,
        customer_name: str,
        customer_address: str | None,
        customer_email: str | None,
        customer_phone: str | None,
        currency: str,
        reference: str | None,
        line_items: list[dict[str, object]],
        subtotal: float,
        vat_total: float,
        total: float,
        vat_breakdown: list[dict[str, float]],
    ) -> bytes:
        try:
            from weasyprint import HTML
        except ImportError as exc:
            raise RuntimeError(
                "WeasyPrint is not installed. Rebuild the backend environment to enable invoice PDFs."
            ) from exc

        title = "INVOICE" if status != "draft" else "DRAFT INVOICE"
        rows = "".join(
            """
            <tr>
              <td>{description}</td>
              <td>{quantity}</td>
              <td>{unit_price}</td>
              <td>{vat_rate}</td>
              <td>{net}</td>
              <td>{vat}</td>
            </tr>
            """.format(
                description=escape(str(item["description"])),
                quantity=escape(str(item["quantity"])),
                unit_price=f"{currency} {float(item['unit_price']):.2f}",
                vat_rate=f"{float(item['vat_rate']):.1f}%",
                net=f"{currency} {float(item['line_total_net']):.2f}",
                vat=f"{currency} {float(item['line_total_vat']):.2f}",
            )
            for item in line_items
        )
        vat_rows = "".join(
            """
            <tr>
              <td>{rate:.1f}%</td>
              <td>{currency} {net:.2f}</td>
              <td>{currency} {vat:.2f}</td>
            </tr>
            """.format(currency=currency, **item)
            for item in vat_breakdown
        )

        customer_meta = "<br />".join(
            escape(value)
            for value in [customer_name, customer_address or "", customer_email or "", customer_phone or ""]
            if value
        )

        html = f"""
        <html>
          <head>
            <style>
              body {{ font-family: sans-serif; color: #1f2937; margin: 32px; }}
              h1 {{ font-size: 28px; margin-bottom: 4px; }}
              .muted {{ color: #64748b; }}
              .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }}
              .card {{ border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; }}
              table {{ width: 100%; border-collapse: collapse; margin-top: 16px; }}
              th, td {{ border-bottom: 1px solid #e2e8f0; padding: 10px 8px; text-align: left; font-size: 12px; }}
              .totals {{ margin-top: 24px; width: 320px; margin-left: auto; }}
              .totals td {{ border: none; padding: 4px 0; }}
              .meta-table td {{ border: none; padding: 2px 0; }}
              .section-title {{ margin-top: 28px; font-size: 14px; font-weight: 700; }}
            </style>
          </head>
          <body>
            <h1>{title}</h1>
            <div class="muted">{escape(invoice_number or 'Draft invoice')}</div>
            <div class="muted">Status: {escape(status.title())}</div>

            <div class="grid">
              <div class="card">
                <strong>From</strong><br />
                {escape(business_name or 'Spendly User')}<br />
                {escape(business_address or '')}
              </div>
              <div class="card">
                <strong>Bill To</strong><br />
                {customer_meta}
              </div>
            </div>

            <table class="meta-table">
              <tr><td><strong>Issued</strong></td><td>{escape(issued_at or 'Draft')}</td></tr>
              <tr><td><strong>Due</strong></td><td>{escape(due_at or '-')}</td></tr>
              <tr><td><strong>Reference</strong></td><td>{escape(reference or '-')}</td></tr>
            </table>

            <div class="section-title">Line Items</div>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>VAT</th>
                  <th>Net</th>
                  <th>VAT Amount</th>
                </tr>
              </thead>
              <tbody>{rows}</tbody>
            </table>

            <div class="section-title">VAT Breakdown</div>
            <table>
              <thead>
                <tr>
                  <th>Rate</th>
                  <th>Net</th>
                  <th>VAT</th>
                </tr>
              </thead>
              <tbody>{vat_rows}</tbody>
            </table>

            <table class="totals">
              <tr><td>Subtotal</td><td>{currency} {subtotal:.2f}</td></tr>
              <tr><td>VAT</td><td>{currency} {vat_total:.2f}</td></tr>
              <tr><td><strong>Total</strong></td><td><strong>{currency} {total:.2f}</strong></td></tr>
            </table>
          </body>
        </html>
        """

        return HTML(string=html).write_pdf()