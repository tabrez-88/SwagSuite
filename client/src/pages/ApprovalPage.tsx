import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Loader2, Download, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ApprovalData {
  id: string;
  orderId: string;
  orderNumber: string;
  orderItemId?: string;
  artworkFileId?: string;
  status: "pending" | "approved" | "declined";
  clientEmail: string;
  clientName?: string;
  sentAt?: string;
  approvedAt?: string;
  declinedAt?: string;
  declineReason?: string;
  pdfPath?: string;
  orderItem?: {
    productName: string;
    quantity: number;
    color?: string;
    size?: string;
    imprintLocation?: string;
    imprintMethod?: string;
  };
  artworkFile?: {
    fileName: string;
    filePath: string;
    originalName: string;
  };
  company?: {
    name: string;
  };
}

export default function ApprovalPage() {
  const params = useParams();
  const token = params.token;
  const [declineReason, setDeclineReason] = useState("");
  const [isDeclineConfirmOpen, setIsDeclineConfirmOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch approval data
  const { data: approval, isLoading, error } = useQuery<ApprovalData>({
    queryKey: [`/api/approvals/${token}`],
    enabled: !!token,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/approvals/${token}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/approvals/${token}`] });
    },
  });

  // Decline mutation
  const declineMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/approvals/${token}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: declineReason }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/approvals/${token}`] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading approval details...</p>
        </div>
      </div>
    );
  }

  if (error || !approval) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Invalid Approval Link</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              This approval link is invalid or has expired. Please contact your sales representative.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isApproved = approval.status === "approved";
  const isDeclined = approval.status === "declined";
  const isPending = approval.status === "pending";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Artwork Approval</h1>
          <p className="text-gray-600">Order #{approval.orderNumber}</p>
          {approval.company && (
            <p className="text-sm text-gray-500">{approval.company.name}</p>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex justify-center mb-6">
          {isApproved && (
            <Badge className="bg-green-100 text-green-800 px-4 py-2">
              <CheckCircle className="h-4 w-4 mr-2 inline" />
              Approved
            </Badge>
          )}
          {isDeclined && (
            <Badge className="bg-red-100 text-red-800 px-4 py-2">
              <XCircle className="h-4 w-4 mr-2 inline" />
              Declined
            </Badge>
          )}
          {isPending && (
            <Badge className="bg-yellow-100 text-yellow-800 px-4 py-2">
              <AlertCircle className="h-4 w-4 mr-2 inline" />
              Awaiting Your Response
            </Badge>
          )}
        </div>

        {/* Product Details Card */}
        {approval.orderItem && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Product</p>
                  <p className="text-base font-semibold">{approval.orderItem.productName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Quantity</p>
                  <p className="text-base">{approval.orderItem.quantity}</p>
                </div>
                {approval.orderItem.color && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Color</p>
                    <p className="text-base">{approval.orderItem.color}</p>
                  </div>
                )}
                {approval.orderItem.size && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Size</p>
                    <p className="text-base">{approval.orderItem.size}</p>
                  </div>
                )}
                {approval.orderItem.imprintLocation && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Imprint Location</p>
                    <p className="text-base">{approval.orderItem.imprintLocation}</p>
                  </div>
                )}
                {approval.orderItem.imprintMethod && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Imprint Method</p>
                    <p className="text-base">{approval.orderItem.imprintMethod}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Artwork Preview Card */}
        {approval.artworkFile && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Artwork Preview</CardTitle>
              <CardDescription>{approval.artworkFile.originalName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center bg-gray-100 rounded-lg p-4 min-h-[300px]">
                {approval.artworkFile.filePath.match(/\.(jpg|jpeg|png|gif|svg)$/i) ? (
                  <img
                    src={approval.artworkFile.filePath}
                    alt="Artwork preview"
                    className="max-w-full max-h-[400px] object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <Download className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Preview not available</p>
                    <a
                      href={approval.artworkFile.filePath}
                      download
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Download file to view
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons - Only show for pending */}
        {isPending && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Response</CardTitle>
              <CardDescription>
                Please review the artwork and product details above, then approve or decline.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {approveMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve Artwork
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (declineReason.trim()) {
                      declineMutation.mutate();
                    } else {
                      setIsDeclineConfirmOpen(true);
                    }
                  }}
                  disabled={declineMutation.isPending}
                  className="flex-1"
                  size="lg"
                >
                  {declineMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Declining...
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Decline Artwork
                    </>
                  )}
                </Button>
              </div>

              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for declining (optional)
                </label>
                <Textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Please let us know what needs to be changed..."
                  rows={3}
                  disabled={declineMutation.isPending}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Approved Status */}
        {isApproved && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Artwork Approved
                </h3>
                <p className="text-gray-600 mb-1">
                  Thank you for approving this artwork!
                </p>
                {approval.approvedAt && (
                  <p className="text-sm text-gray-500">
                    Approved on {new Date(approval.approvedAt).toLocaleString()}
                  </p>
                )}
                <p className="text-gray-600 mt-4">
                  Your sales representative has been notified and will proceed with production.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Declined Status */}
        {isDeclined && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Artwork Declined
                </h3>
                {approval.declinedAt && (
                  <p className="text-sm text-gray-500 mb-4">
                    Declined on {new Date(approval.declinedAt).toLocaleString()}
                  </p>
                )}
                {approval.declineReason && (
                  <div className="bg-white rounded-lg p-4 mb-4 text-left">
                    <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                    <p className="text-gray-600">{approval.declineReason}</p>
                  </div>
                )}
                <p className="text-gray-600">
                  Your sales representative has been notified and will contact you with revised artwork.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PDF Download */}
        {approval.pdfPath && (
          <div className="text-center mt-6">
            <a
              href={approval.pdfPath}
              download
              className="inline-flex items-center text-blue-600 hover:text-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF Record
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Questions? Contact your sales representative or reply to the approval email.
          </p>
        </div>
      </div>

      {/* Decline Without Reason Confirmation */}
      <AlertDialog open={isDeclineConfirmOpen} onOpenChange={setIsDeclineConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Decline Without Reason?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You haven't provided a reason for declining. Are you sure you want to decline without providing a reason?
              <span className="block mt-2 text-orange-600 font-medium">
                Providing a reason helps the team make revisions.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeclineConfirmOpen(false)}>
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                declineMutation.mutate();
                setIsDeclineConfirmOpen(false);
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Decline Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
