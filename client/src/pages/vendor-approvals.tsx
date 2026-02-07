import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertTriangle,
  Check,
  X,
  Clock,
  Building2,
  User,
  Package,
  MessageSquare,
  ShieldAlert,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface VendorApprovalRequest {
  id: string;
  supplierId: string;
  productId?: string;
  orderId?: string;
  requestedBy: string;
  reason?: string;
  status: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  // Enriched data
  supplier?: {
    id: string;
    name: string;
  };
  requestedByUser?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    username?: string;
  };
  reviewedByUser?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    username?: string;
  };
  product?: {
    id: string;
    name: string;
  };
}

export default function VendorApprovals() {
  const [selectedRequest, setSelectedRequest] = useState<VendorApprovalRequest | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery<VendorApprovalRequest[]>({
    queryKey: ["/api/vendor-approvals"],
    queryFn: async () => {
      const response = await fetch("/api/vendor-approvals", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch approval requests");
      return response.json();
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const response = await fetch(`/api/vendor-approvals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, reviewNotes: notes }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update request");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.status === "approved" ? "Request Approved" : "Request Rejected",
        description: `The vendor approval request has been ${variables.status}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-approvals"] });
      setIsReviewDialogOpen(false);
      setSelectedRequest(null);
      setReviewNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const rejectedRequests = requests.filter((r) => r.status === "rejected");

  const openReviewDialog = (request: VendorApprovalRequest) => {
    setSelectedRequest(request);
    setReviewNotes("");
    setIsReviewDialogOpen(true);
  };

  const handleReview = (status: "approved" | "rejected") => {
    if (!selectedRequest) return;
    reviewMutation.mutate({
      id: selectedRequest.id,
      status,
      notes: reviewNotes,
    });
  };

  const getUserDisplayName = (user?: VendorApprovalRequest["requestedByUser"]) => {
    if (!user) return "Unknown";
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.username || user.email || "Unknown";
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const RequestTable = ({ items, showActions }: { items: VendorApprovalRequest[]; showActions?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vendor</TableHead>
          <TableHead>Requested By</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          {showActions && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showActions ? 6 : 5} className="text-center py-8 text-muted-foreground">
              No requests found
            </TableCell>
          </TableRow>
        ) : (
          items.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{request.supplier?.name || "Unknown Vendor"}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm">{getUserDisplayName(request.requestedByUser)}</p>
                    <p className="text-xs text-muted-foreground">{request.requestedByUser?.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm max-w-[200px] truncate">
                  {request.reason || <span className="text-muted-foreground italic">No reason provided</span>}
                </p>
              </TableCell>
              <TableCell>
                <StatusBadge status={request.status} />
              </TableCell>
              <TableCell>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                </p>
              </TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <Button size="sm" onClick={() => openReviewDialog(request)}>
                    Review
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-swag-primary" />
          Vendor Approval Requests
        </h1>
        <p className="text-muted-foreground mt-1">
          Review and manage requests to order from restricted vendors
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingRequests.length}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-3xl font-bold text-green-600">{approvedRequests.length}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{rejectedRequests.length}</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending
            {pendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-1 bg-yellow-100 text-yellow-800">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rejected
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approval Requests</CardTitle>
              <CardDescription>
                These requests are waiting for administrator review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RequestTable items={pendingRequests} showActions />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Approved Requests</CardTitle>
              <CardDescription>
                Requests that have been approved
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RequestTable items={approvedRequests} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Requests</CardTitle>
              <CardDescription>
                Requests that have been rejected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RequestTable items={rejectedRequests} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Review Vendor Approval Request
            </DialogTitle>
            <DialogDescription>
              Review the request and approve or reject it
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedRequest.supplier?.name}</span>
                  <Badge variant="destructive" className="ml-auto">Do Not Order</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Requested by: {getUserDisplayName(selectedRequest.requestedByUser)}</span>
                </div>
                {selectedRequest.product && (
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>Product: {selectedRequest.product.name}</span>
                  </div>
                )}
                {selectedRequest.reason && (
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Reason:</p>
                      <p className="text-sm text-muted-foreground">{selectedRequest.reason}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewNotes">Review Notes (optional)</Label>
                <Textarea
                  id="reviewNotes"
                  placeholder="Add notes about your decision..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsReviewDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleReview("rejected")}
              disabled={reviewMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleReview("approved")}
              disabled={reviewMutation.isPending}
            >
              <Check className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
