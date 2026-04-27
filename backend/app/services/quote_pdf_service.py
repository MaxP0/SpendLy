from __future__ import annotations

from html import escape
from pathlib import Path

from app.core.config import get_settings

settings = get_settings()


class QuotePDFService:
    """Generates quote PDFs and resolves their storage path."""

    def __init__(self) -> None:
        self.base_dir = Path(__file__).resolve().parents[2] / settings.UPLOADS_DIR / "quotes"

    def get_quote_pdf_path(self, token: str) -> Path:
        self.base_dir.mkdir(parents=True, exist_ok=True)
        return self.base_dir / f"{token}.pdf"

    def generate_quote_pdf(
        self,
        *,
        token: str,
        business_name: str | None,
        business_address: str | None,
        customer_name: str,
        customer_address: str | None,
        title: str,
        valid_until: str,
        line_items: list[dict[str, object]],
        subtotal: float,
        vat_total: float,
        total: float,
    ) -> Path:
        try:
            from weasyprint import HTML
        except ImportError as exc:
            raise RuntimeError(
                "WeasyPrint is not installed. Rebuild the backend environment to enable quote PDFs."
            ) from exc

        rows = "".join(
            """
            <tr>
              <td>{description}</td>
              <td>{quantity}</td>
              <td>EUR {unit_price:.2f}</td>
              <td>{vat_rate:.1f}%</td>
              <td>EUR {line_total_net:.2f}</td>
              <td>EUR {line_total_vat:.2f}</td>
            </tr>
            """.format(
                description=escape(str(item["description"])),
                quantity=item["quantity"],
                unit_price=float(item["unit_price"]),
                vat_rate=float(item["vat_rate"]),
                line_total_net=float(item["line_total_net"]),
                line_total_vat=float(item["line_total_vat"]),
            )
            for item in line_items
        )

        html = f"""
        <html>
          <head>
            <style>
              body {{ font-family: sans-serif; color: #1f2937; margin: 32px; }}
              h1 {{ font-size: 28px; margin-bottom: 0; }}
              .meta {{ margin-top: 8px; color: #475569; }}
              .section {{ margin-top: 24px; }}
              .card {{ border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; }}
              table {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
              th, td {{ border-bottom: 1px solid #e2e8f0; padding: 10px 8px; text-align: left; font-size: 12px; }}
              .totals {{ margin-top: 20px; width: 320px; margin-left: auto; }}
              .totals td {{ border: none; padding: 4px 0; }}
              .validity {{ color: #b45309; font-weight: 700; margin-top: 12px; }}
              .footer {{ margin-top: 48px; color: #64748b; font-size: 12px; }}
            </style>
          </head>
          <body>
            <h1>QUOTE</h1>
            <div class="meta">{escape(business_name or 'Spendly User')}</div>
            <div class="meta">{escape(business_address or '')}</div>

            <div class="section card">
              <strong>Customer</strong><br />
              {escape(customer_name)}<br />
              {escape(customer_address or '')}
            </div>

            <div class="section">
              <strong>{escape(title)}</strong>
              <div class="validity">Valid until {escape(valid_until)}</div>
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
            </div>

            <table class="totals">
              <tr><td>Subtotal</td><td>EUR {subtotal:.2f}</td></tr>
              <tr><td>VAT</td><td>EUR {vat_total:.2f}</td></tr>
              <tr><td><strong>Total</strong></td><td><strong>EUR {total:.2f}</strong></td></tr>
            </table>

            <div class="footer">This is a quote, not a tax invoice.</div>
          </body>
        </html>
        """

        pdf_path = self.get_quote_pdf_path(token)
        HTML(string=html).write_pdf(pdf_path)
        return pdf_path