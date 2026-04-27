import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { differenceInCalendarDays, format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  usePublicAcceptInquiry,
  usePublicInquiry,
  usePublicRejectInquiry,
  usePublicRequestDiscussion,
} from "@/hooks/useInquiries";
import type { PublicInquiry } from "@/types/api";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}

function statusPanel(inquiry: PublicInquiry) {
  switch (inquiry.status) {
    case "accepted":
      return `Quote accepted on ${inquiry.accepted_at ? format(new Date(inquiry.accepted_at), "dd MMM yyyy") : "today"}. The contractor will be in touch.`;
    case "rejected":
      return "This quote has been declined.";
    case "expired":
      return "This quote has expired. Please contact the contractor for a new one.";
    case "discussion_requested":
      return "We've received your message and the contractor will respond shortly.";
    case "invoiced":
    case "completed":
      return "Work has been invoiced. Thank you.";
    default:
      return "";
  }
}

export default function PublicQuotePage() {
  const { token } = useParams();
  const publicInquiryQuery = usePublicInquiry(token);
  const acceptMutation = usePublicAcceptInquiry(token);
  const rejectMutation = usePublicRejectInquiry(token);
  const discussionMutation = usePublicRequestDiscussion(token);

  const [inquiry, setInquiry] = useState<PublicInquiry | null>(null);
  const [note, setNote] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (publicInquiryQuery.data) {
      setInquiry(publicInquiryQuery.data);
    }
  }, [publicInquiryQuery.data]);

  const daysRemaining = useMemo(() => {
    if (!inquiry?.valid_until) {
      return null;
    }
    return differenceInCalendarDays(new Date(inquiry.valid_until), new Date());
  }, [inquiry?.valid_until]);

  const updateInquiryState = (nextStatus: PublicInquiry["status"], payload: Record<string, unknown>) => {
    setInquiry((current) =>
      current
        ? {
            ...current,
            ...payload,
            status: nextStatus,
            available_actions: payload.available_actions as string[] ?? [],
          }
        : current,
    );
  };

  const handleAccept = async () => {
    try {
      const response = await acceptMutation.mutateAsync();
      updateInquiryState("accepted", response);
      toast.success("Quote accepted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to accept quote");
    }
  };

  const handleReject = async () => {
    try {
      const response = await rejectMutation.mutateAsync(note.trim() || undefined);
      updateInquiryState("rejected", response);
      toast.success("Quote declined");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reject quote");
    }
  };

  const handleDiscussion = async () => {
    if (!note.trim()) {
      setValidationError("Please add a note before requesting discussion.");
      return;
    }

    setValidationError(null);
    try {
      const response = await discussionMutation.mutateAsync(note.trim());
      updateInquiryState("discussion_requested", response);
      toast.success("Discussion request sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to request discussion");
    }
  };

  if (publicInquiryQuery.isLoading || !inquiry) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-700">
        <div className="mx-auto max-w-4xl">Loading quote...</div>
      </div>
    );
  }

  if (publicInquiryQuery.isError) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-700">
        <div className="mx-auto max-w-4xl rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold">Quote unavailable</h1>
          <p className="mt-2 text-sm text-slate-500">{publicInquiryQuery.error instanceof Error ? publicInquiryQuery.error.message : "Quote not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">QUOTE</p>
              <CardTitle className="text-3xl">{inquiry.business_name ?? "Spendly User"}</CardTitle>
              <CardDescription>{inquiry.business_address}</CardDescription>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Quote for</p>
              <p className="text-lg font-semibold">{inquiry.customer_name}</p>
              <p className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-medium ${daysRemaining !== null && daysRemaining < 3 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                Valid until {inquiry.valid_until ? format(new Date(inquiry.valid_until), "dd MMM yyyy") : "-"}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">{inquiry.title}</h2>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Unit price</th>
                    <th className="px-4 py-3">VAT</th>
                    <th className="px-4 py-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiry.line_items.map((item, index) => (
                    <tr key={item.id ?? `${item.description}-${index}`} className="border-t border-slate-200">
                      <td className="px-4 py-3">{item.description}</td>
                      <td className="px-4 py-3">{item.quantity}</td>
                      <td className="px-4 py-3">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-3">{item.vat_rate}%</td>
                      <td className="px-4 py-3">{formatCurrency(item.line_total_net + item.line_total_vat)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(inquiry.subtotal)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                <span>VAT</span>
                <span>{formatCurrency(inquiry.vat_total)}</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatCurrency(inquiry.total)}</span>
              </div>
            </div>

            {inquiry.status === "sent" ? (
              <div className="space-y-4 rounded-xl border border-slate-200 p-4">
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Optional note for reject, required for discussion"
                />
                {validationError ? <p className="text-sm text-rose-600">{validationError}</p> : null}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button onClick={handleAccept} className="flex-1">Accept</Button>
                  <Button onClick={handleDiscussion} variant="outline" className="flex-1">Request Discussion</Button>
                  <Button onClick={handleReject} variant="outline" className="flex-1">Reject</Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-medium text-slate-700">{statusPanel(inquiry)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <footer className="pb-6 text-center text-xs text-slate-500">Powered by Spendly</footer>
      </div>
    </div>
  );
}