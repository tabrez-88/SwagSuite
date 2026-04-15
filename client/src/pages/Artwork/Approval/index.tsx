import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2, XCircle, Clock, AlertCircle, Package, FileText, Mail,
  ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, Palette, History, Image,
} from "lucide-react";
import { useApproval } from "./hooks";

function ApprovalPage() {
  const {
    approval,
    isLoading,
    error,
    artworkDetails,
    approvalHistory,
    isApproved,
    isRejected,
    isPending,
    zoom,
    isFullscreen,
    rotation,
    viewMode,
    setViewMode,
    imageContainerRef,
    currentImageUrl,
    hasOriginal,
    hasProof,
    comments,
    setComments,
    approveMutation,
    rejectMutation,
    handleApprove,
    handleReject,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleRotate,
    toggleFullscreen,
  } = useApproval();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-5xl mx-4">
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
        <Card className="w-full max-w-5xl mx-4">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Approval Link</h2>
            <p className="text-gray-600 mb-4">
              This approval link is invalid or has expired. Please contact support if you believe this is an error.
            </p>
            <a href="mailto:orders@liquidscreendesign.com">
              <Button variant="outline"><Mail className="w-4 h-4 mr-2" /> Contact Support</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Artwork Proof Approval</h1>
          <p className="text-gray-500 text-sm">
            Order #{approval.order?.orderNumber || "N/A"} &middot; {approval.order?.companyName || ""}
          </p>
          {approval.clientName && (
            <p className="text-gray-400 text-xs mt-1">Sent to {approval.clientName}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Artwork Preview (spans 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Approval Actions (for pending) — shown at top */}
            {isPending && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" /> APPROVAL
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Review the artwork carefully, then approve or request changes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-1.5">
                      Comments or Feedback
                    </label>
                    <Textarea
                      placeholder="Add any comments, suggestions, or revision requests..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows={3}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Optional for approval, required for revision requests</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-3">
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
                  <p className="text-[10px] text-center text-gray-400">
                    By clicking "Approve Artwork", you confirm the artwork is ready for production
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Approved state — shown at top */}
            {isApproved && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="py-8 text-center">
                  <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-green-900 mb-1">Artwork Approved!</h3>
                  <p className="text-green-700 text-sm mb-3">
                    Approved on {new Date(approval.approvedAt!).toLocaleDateString()}
                  </p>
                  {approval.comments && (
                    <div className="bg-white rounded-lg p-3 text-left max-w-xl mx-auto">
                      <p className="text-xs text-gray-500 mb-1">Your Comments:</p>
                      <p className="text-sm text-gray-700">{approval.comments}</p>
                    </div>
                  )}
                  <p className="text-xs text-green-600 mt-3">Production has been notified and will begin shortly.</p>
                </CardContent>
              </Card>
            )}

            {/* Rejected state — shown at top */}
            {isRejected && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="py-8 text-center">
                  <XCircle className="w-14 h-14 text-red-600 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-red-900 mb-1">Revision Requested</h3>
                  <p className="text-red-700 text-sm mb-3">
                    Submitted on {new Date(approval.rejectedAt!).toLocaleDateString()}
                  </p>
                  {approval.comments && (
                    <div className="bg-white rounded-lg p-3 text-left max-w-xl mx-auto">
                      <p className="text-xs text-gray-500 mb-1">Your Feedback:</p>
                      <p className="text-sm text-gray-700">{approval.comments}</p>
                    </div>
                  )}
                  <p className="text-xs text-red-600 mt-3">Our team is working on revisions based on your feedback.</p>
                </CardContent>
              </Card>
            )}

            {/* Artwork Preview Card */}
            <Card className={isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Image className="w-4 h-4" /> Artwork Preview
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    {/* View mode toggle */}
                    {hasOriginal && hasProof && (
                      <div className="flex items-center bg-gray-100 rounded-md p-0.5 mr-2">
                        <button
                          onClick={() => setViewMode("proof")}
                          className={`px-3 py-1 text-xs rounded transition-colors ${viewMode === "proof" ? "bg-white shadow text-blue-700 font-medium" : "text-gray-500 hover:text-gray-700"}`}
                        >
                          Proof
                        </button>
                        <button
                          onClick={() => setViewMode("original")}
                          className={`px-3 py-1 text-xs rounded transition-colors ${viewMode === "original" ? "bg-white shadow text-blue-700 font-medium" : "text-gray-500 hover:text-gray-700"}`}
                        >
                          Original
                        </button>
                      </div>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleZoomOut} title="Zoom Out">
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-xs text-gray-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleZoomIn} title="Zoom In">
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleRotate} title="Rotate">
                      <RotateCw className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleResetZoom} title="Reset">
                      <span className="text-xs font-medium">1:1</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                      {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                {viewMode === "original" && (
                  <p className="text-xs text-amber-600 mt-1">Viewing original artwork file (not the vendor proof)</p>
                )}
              </CardHeader>
              <CardContent>
                {currentImageUrl ? (
                  <div
                    ref={imageContainerRef}
                    className={`bg-gray-100 rounded-lg overflow-auto flex items-center justify-center ${isFullscreen ? "h-[calc(100vh-120px)]" : "min-h-[400px] max-h-[600px]"}`}
                    style={{ cursor: zoom > 1 ? "grab" : "default" }}
                  >
                    <img
                      src={currentImageUrl}
                      alt="Artwork"
                      className="transition-transform duration-200"
                      style={{
                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                        transformOrigin: "center center",
                        maxWidth: zoom <= 1 ? "100%" : "none",
                        maxHeight: zoom <= 1 ? "100%" : "none",
                      }}
                      draggable={false}
                    />
                  </div>
                ) : (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Artwork file not available</p>
                    <p className="text-sm text-gray-500 mt-2">Please contact support for assistance</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Details sidebar */}
          <div className="space-y-4">
            {/* Product Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="w-4 h-4" /> Product
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold">{approval.orderItem?.productName || "Product"}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-[10px] text-gray-400 uppercase">Qty</p>
                    <p className="font-semibold text-sm">{approval.orderItem?.quantity || 0}</p>
                  </div>
                  {approval.orderItem?.color && (
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-[10px] text-gray-400 uppercase">Color</p>
                      <p className="font-semibold text-sm truncate">{approval.orderItem.color}</p>
                    </div>
                  )}
                  {approval.orderItem?.size && (
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-[10px] text-gray-400 uppercase">Size</p>
                      <p className="font-semibold text-sm">{approval.orderItem.size}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Decoration Details */}
            {artworkDetails.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="w-4 h-4" /> Decoration Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {artworkDetails.map((art) => (
                    <div key={art.id} className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                      <p className="text-sm font-semibold">{art.name}</p>
                      {art.artworkType && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Imprint Type</span>
                          <span className="font-medium capitalize">{art.artworkType.replace(/-/g, " ")}</span>
                        </div>
                      )}
                      {art.location && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Location</span>
                          <span className="font-medium">{art.location}</span>
                        </div>
                      )}
                      {art.size && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Size</span>
                          <span className="font-medium">{art.size}</span>
                        </div>
                      )}
                      {art.color && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Colors</span>
                          <span className="font-medium">{art.color}</span>
                        </div>
                      )}
                      {art.notes && (
                        <div className="text-xs mt-1 pt-1 border-t">
                          <span className="text-gray-500">Notes: </span>
                          <span className="text-gray-700">{art.notes}</span>
                        </div>
                      )}
                      {art.status && (
                        <Badge variant="outline" className="text-[10px] mt-1">
                          {art.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Approval History */}
            {approvalHistory.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="w-4 h-4" /> Previous Rounds
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {approvalHistory.map((hist) => (
                      <div key={hist.id} className="flex items-start gap-2 p-2 rounded bg-gray-50 border text-xs">
                        {hist.status === "approved" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : hist.status === "declined" ? (
                          <XCircle className="w-3.5 h-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="font-medium capitalize">{hist.status}</span>
                            <span className="text-gray-400">
                              {hist.approvedAt ? new Date(hist.approvedAt).toLocaleDateString() :
                               hist.declinedAt ? new Date(hist.declinedAt).toLocaleDateString() :
                               hist.sentAt ? new Date(hist.sentAt).toLocaleDateString() : ""}
                            </span>
                          </div>
                          {hist.declineReason && (
                            <p className="text-gray-600 mt-0.5 truncate" title={hist.declineReason}>
                              {hist.declineReason}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Help Section */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="py-4">
                <h4 className="font-semibold text-blue-900 mb-1 text-sm">Need Help?</h4>
                <p className="text-xs text-blue-700 mb-2">
                  Questions about the artwork? Contact our team.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="mailto:orders@liquidscreendesign.com">
                    <Mail className="w-3 h-3 mr-1.5" /> Contact Support
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApprovalPage;
