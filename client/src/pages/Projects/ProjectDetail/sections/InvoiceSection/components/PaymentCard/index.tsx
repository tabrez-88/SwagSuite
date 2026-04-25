import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Banknote, CheckCircle, CreditCard, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import type { Invoice } from "@shared/schema";

interface PaymentCardProps {
  invoice: Invoice;
  onCopyPaymentLink: () => void;
  onOpenPaymentDialog: () => void;
}

export default function PaymentCard({
  invoice,
  onCopyPaymentLink,
  onOpenPaymentDialog,
}: PaymentCardProps) {
  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Payment
          </CardTitle>
          {invoice.status === "paid" && (
            <Badge className="bg-green-100 text-green-800">PAID</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {invoice.status === "paid" ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Payment received</span>
            </div>
            {invoice.paymentMethod && (
              <p className="text-sm text-gray-500">
                Method: {invoice.paymentMethod}
                {invoice.paymentReference &&
                  ` (Ref: ${invoice.paymentReference})`}
              </p>
            )}
            {invoice.paidAt && (
              <p className="text-xs text-gray-400">
                Paid on{" "}
                {format(new Date(invoice.paidAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Payment pending — $
              {Number(invoice.totalAmount || 0).toLocaleString()} due
              {invoice.dueDate &&
                ` by ${format(new Date(invoice.dueDate), "MMM d, yyyy")}`}
            </p>

            {/* Stripe payment link */}
            {invoice.stripeInvoiceUrl && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onCopyPaymentLink}>
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Copy Payment Link
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <a
                    href={invoice.stripeInvoiceUrl ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in Stripe
                  </a>
                </Button>
              </div>
            )}

            {/* Manual payment */}
            <Button size="sm" onClick={onOpenPaymentDialog}>
              <Banknote className="w-4 h-4 mr-1" />
              Record Manual Payment
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
