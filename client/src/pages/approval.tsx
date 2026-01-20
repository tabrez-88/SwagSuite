import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Clock, AlertCircle, Package, FileText, Mail } from "lucide-react";

interface ApprovalData {
  id: string;
  orderId: string;
  orderNumber: string;
  orderItemId: string;
  approvalToken: string;
  status: "pending" | "approved" | "rejected";
  artworkUrl?: string;
  approvedAt?: string;
  rejectedAt?: string;
  comments?: string;
  company: {
    name: string;
  }
  order: {
    orderNumber: string;
    companyName: string;
  };
  orderItem: {
    productName: string;
    productSku?: string;
    quantity: number;
    color?: string;
    size?: string;
  };
  artworkFile?: {
    fileName: string;
    filePath: string;
    originalName: string;
  };
}

function ApprovalPage() {
  const [, params] = useRoute("/approval/:token");
  const token = params?.token;
  const { toast } = useToast();
  const [comments, setComments] = useState("");

  // Fetch approval data
  const { data: approval, isLoading, error } = useQuery<ApprovalData>({
    queryKey: [`/api/approvals/${token}`],
    enabled: !!token,
    retry: false,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (data: { comments?: string }) => {
      const response = await fetch(`/api/approvals/${token}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to approve artwork");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Artwork Approved! ✅",
        description: "Thank you! The artwork has been approved and production will begin.",
      });
      window.location.reload();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve artwork. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (data: { comments: string }) => {
      const response = await fetch(`/api/approvals/${token}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to reject artwork");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted ✅",
        description: "We've received your feedback and will revise the artwork.",
      });
      window.location.reload();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    approveMutation.mutate({ comments: comments || undefined });
  };

  const handleReject = () => {
    if (!comments.trim()) {
      toast({
        title: "Comments Required",
        description: "Please provide feedback about what needs to be changed.",
        variant: "destructive",
      });
      return;
    }
    rejectMutation.mutate({ comments });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="py-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading artwork approval...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !approval) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Approval Link</h2>
            <p className="text-gray-600 mb-4">
              This approval link is invalid or has expired. Please contact support if you believe this is an error.
            </p>
            <a href="mailto:support@swagsuite.com">
              <Button variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isApproved = approval.status === "approved";
  const isRejected = approval.status === "rejected";
  const isPending = approval.status === "pending";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Artwork Approval
          </h1>
          <p className="text-gray-600">
            Review and approve your custom product artwork
          </p>
        </div>

        {/* Order Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="font-semibold">#{approval.orderNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Company</p>
                <p className="font-semibold">{approval.company?.name || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Product Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Product</p>
                <p className="font-semibold text-lg">{approval.orderItem?.productName || 'Product'}</p>
                {approval.orderItem?.productSku && (
                  <p className="text-sm text-gray-500">SKU: {approval.orderItem.productSku}</p>
                )}
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-sm text-gray-500">Quantity</p>
                  <p className="font-semibold">{approval.orderItem?.quantity || 0}</p>
                </div>
                {approval.orderItem?.color && (
                  <div>
                    <p className="text-sm text-gray-500">Color</p>
                    <p className="font-semibold">{approval.orderItem.color}</p>
                  </div>
                )}
                {approval.orderItem?.size && (
                  <div>
                    <p className="text-sm text-gray-500">Size</p>
                    <p className="font-semibold">{approval.orderItem.size}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Artwork Preview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Artwork Preview</CardTitle>
            <CardDescription>
              Review the artwork carefully before approving
            </CardDescription>
          </CardHeader>
          <CardContent>
            {approval.artworkFile?.filePath || approval.artworkUrl ? (
              <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
                <img
                  src={approval.artworkFile?.filePath || approval.artworkUrl}
                  alt="Product Artwork"
                  className="max-w-full max-h-96 object-contain"
                />
              </div>
            ) : (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Artwork file not available</p>
                <p className="text-sm text-gray-500 mt-2">
                  Please contact support for assistance
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval Status or Actions */}
        {isApproved && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="py-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-green-900 mb-2">
                Artwork Approved!
              </h3>
              <p className="text-green-700 mb-4">
                Approved on {new Date(approval.approvedAt!).toLocaleDateString()}
              </p>
              {approval.comments && (
                <div className="bg-white rounded-lg p-4 text-left max-w-xl mx-auto">
                  <p className="text-sm text-gray-500 mb-1">Your Comments:</p>
                  <p className="text-gray-700">{approval.comments}</p>
                </div>
              )}
              <p className="text-sm text-green-600 mt-4">
                Production has been notified and will begin shortly.
              </p>
            </CardContent>
          </Card>
        )}

        {isRejected && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-8 text-center">
              <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-red-900 mb-2">
                Revision Requested
              </h3>
              <p className="text-red-700 mb-4">
                Submitted on {new Date(approval.rejectedAt!).toLocaleDateString()}
              </p>
              {approval.comments && (
                <div className="bg-white rounded-lg p-4 text-left max-w-xl mx-auto">
                  <p className="text-sm text-gray-500 mb-1">Your Feedback:</p>
                  <p className="text-gray-700">{approval.comments}</p>
                </div>
              )}
              <p className="text-sm text-red-600 mt-4">
                Our team is working on revisions based on your feedback.
              </p>
            </CardContent>
          </Card>
        )}

        {isPending && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Approval Required
              </CardTitle>
              <CardDescription>
                Please review the artwork and provide your decision
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Comments */}
              <div>
                <label className="text-sm font-medium block mb-2">
                  Comments or Feedback (Optional for approval, required for rejection)
                </label>
                <Textarea
                  placeholder="Add any comments, suggestions, or revision requests..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                />
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={handleReject}
                  disabled={rejectMutation.isPending}
                  className="w-full"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  {rejectMutation.isPending ? "Submitting..." : "Request Revisions"}
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  {approveMutation.isPending ? "Approving..." : "Approve Artwork"}
                </Button>
              </div>

              <p className="text-xs text-center text-gray-500 mt-4">
                By clicking "Approve Artwork", you confirm that the artwork is ready for production
              </p>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="py-6">
            <h4 className="font-semibold text-blue-900 mb-2">Need Help?</h4>
            <p className="text-sm text-blue-700 mb-3">
              If you have questions about the artwork or need assistance, please contact our support team.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="mailto:support@swagsuite.com">
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ApprovalPage;
