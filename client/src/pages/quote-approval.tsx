import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  Download,
  Package,
  Calendar,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";

interface QuoteApprovalData {
  id: string;
  orderId: string;
  approvalToken: string;
  status: "pending" | "approved" | "declined";
  clientEmail?: string;
  clientName?: string;
  quoteTotal?: string;
  sentAt?: string;
  viewedAt?: string;
  approvedAt?: string;
  declinedAt?: string;
  declineReason?: string;
  approvalNotes?: string;
  pdfPath?: string;
  orderNumber?: string;
  orderTotal?: string;
  companyName?: string;
  inHandsDate?: string;
  items: Array<{
    id: string;
    productName?: string;
    productSku?: string;
    quantity: number;
    unitPrice?: string;
    totalPrice?: string;
    color?: string;
    size?: string;
  }>;
}

export default function QuoteApprovalPage() {
  const [, params] = useRoute("/quote-approval/:token");
  const token = params?.token;
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const queryClient = useQueryClient();

  // Fetch quote approval data
  const { data: approval, isLoading, error } = useQuery<QuoteApprovalData>({
    queryKey: [`/api/quote-approvals/${token}`],
    enabled: !!token,
    retry: false,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (data: { notes?: string }) => {
      const response = await fetch(`/api/quote-approvals/${token}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to approve quote");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/quote-approvals/${token}`] });
      toast({
        title: "Quote Approved! ✅",
        description: "Thank you! Your order has been confirmed and will proceed to production.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve quote. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Decline mutation
  const declineMutation = useMutation({
    mutationFn: async (data: { reason: string }) => {
      const response = await fetch(`/api/quote-approvals/${token}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to decline quote");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/quote-approvals/${token}`] });
      toast({
        title: "Quote Declined",
        description: "Your feedback has been sent to the sales team. They will contact you shortly.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to decline quote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    approveMutation.mutate({ notes: notes.trim() || undefined });
  };

  const handleDecline = () => {
    if (!declineReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for declining the quote.",
        variant: "destructive",
      });
      return;
    }
    declineMutation.mutate({ reason: declineReason });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (error || !approval) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Quote Not Found</CardTitle>
            <CardDescription>
              This quote approval link is invalid or has expired. Please contact your sales representative for assistance.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isPending = approval.status === "pending";
  const isApproved = approval.status === "approved";
  const isDeclined = approval.status === "declined";

  const getStatusBadge = () => {
    if (isApproved) {
      return <Badge className="bg-green-500 text-white">Approved</Badge>;
    }
    if (isDeclined) {
      return <Badge variant="destructive">Declined</Badge>;
    }
    return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Awaiting Approval</Badge>;
  };

  const getStatusIcon = () => {
    if (isApproved) return <CheckCircle2 className="w-8 h-8 text-green-600" />;
    if (isDeclined) return <XCircle className="w-8 h-8 text-red-600" />;
    return <Clock className="w-8 h-8 text-yellow-600" />;
  };

  const quoteTotal = parseFloat(approval.quoteTotal || approval.orderTotal || "0");

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quote Approval</h1>
              <p className="text-gray-600">Order #{approval.orderNumber}</p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              {getStatusBadge()}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Status Message */}
        {isApproved && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">Quote Approved</p>
                  <p className="text-sm text-green-700">
                    Approved on {approval.approvedAt ? format(new Date(approval.approvedAt), 'MMMM dd, yyyy \'at\' h:mm a') : 'N/A'}
                    {approval.clientName && ` by ${approval.clientName}`}
                  </p>
                  {approval.approvalNotes && (
                    <p className="text-sm text-green-600 mt-2">Notes: {approval.approvalNotes}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isDeclined && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="w-6 h-6 text-red-600" />
                <div>
                  <p className="font-semibold text-red-800">Quote Declined</p>
                  <p className="text-sm text-red-700">
                    Declined on {approval.declinedAt ? format(new Date(approval.declinedAt), 'MMMM dd, yyyy \'at\' h:mm a') : 'N/A'}
                  </p>
                  {approval.declineReason && (
                    <p className="text-sm text-red-600 mt-2">Reason: {approval.declineReason}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quote Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Quote Summary
            </CardTitle>
            <CardDescription>
              {approval.companyName || 'Your Order'} • Sent {approval.sentAt ? format(new Date(approval.sentAt), 'MMMM dd, yyyy') : 'N/A'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Key Details */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Quote Number</p>
                  <p className="font-medium">{approval.orderNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Amount</p>
                  <p className="font-medium">${quoteTotal.toFixed(2)}</p>
                </div>
              </div>
              {approval.inHandsDate && (
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 rounded">
                    <Calendar className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">In-Hands Date</p>
                    <p className="font-medium">{format(new Date(approval.inHandsDate), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* PDF Download */}
            {approval.pdfPath && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = approval.pdfPath!;
                    const fileName = `Quote-${approval.orderNumber || 'document'}.pdf`;
                    link.download = fileName;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Quote PDF
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PDF Preview */}
        {approval.pdfPath && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Quote Document
              </CardTitle>
              <CardDescription>
                Review the full quote document below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden bg-gray-100">
                {/* Use Google Docs Viewer for Cloudinary PDFs */}
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(approval.pdfPath)}&embedded=true`}
                  className="w-full h-[600px] md:h-[800px]"
                  title="Quote PDF Preview"
                  style={{ border: 'none' }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                If the preview doesn't load, please use the download button above.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Items ({approval.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {approval.items.map((item, index) => (
                <div key={item.id || index} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{item.productName || 'Product'}</p>
                      {item.productSku && <p className="text-sm text-gray-500">SKU: {item.productSku}</p>}
                      <div className="flex gap-3 mt-1 text-sm text-gray-600">
                        <span>Qty: {item.quantity}</span>
                        {item.color && <span>Color: {item.color}</span>}
                        {item.size && <span>Size: {item.size}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${parseFloat(item.totalPrice || "0").toFixed(2)}</p>
                      <p className="text-sm text-gray-500">${parseFloat(item.unitPrice || "0").toFixed(2)} each</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span className="text-blue-600">${quoteTotal.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Approval Actions */}
        {isPending && (
          <Card>
            <CardHeader>
              <CardTitle>Your Decision</CardTitle>
              <CardDescription>
                Hi {approval.clientName || 'there'}! Please review the quote above and approve or request changes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showDeclineForm ? (
                <>
                  {/* Notes for Approval */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any notes or special instructions..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleApprove}
                      disabled={approveMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {approveMutation.isPending ? "Processing..." : "Approve Quote"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeclineForm(true)}
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Request Changes
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Decline Form */}
                  <div className="space-y-2">
                    <Label htmlFor="declineReason">Reason for Requesting Changes *</Label>
                    <Textarea
                      id="declineReason"
                      placeholder="Please describe what changes you'd like to see..."
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      rows={4}
                      className="border-red-200 focus:border-red-400"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeclineForm(false)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleDecline}
                      disabled={declineMutation.isPending || !declineReason.trim()}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {declineMutation.isPending ? "Submitting..." : "Submit Request"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-4">
          <p>Thank you for your business!</p>
          <p>If you have any questions, please contact your sales representative.</p>
        </div>
      </div>
    </div>
  );
}
