import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Package,
  Send,
  X,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { OrderItemLine } from "@shared/schema";

interface ProductPreviewLightboxProps {
  item: any;
  orderId: string;
  companyName: string;
  hidePricing: boolean;
  comments: any[];
  onClose: () => void;
}

export default function ProductPreviewLightbox({ item, orderId, companyName, hidePricing, comments, onClose }: ProductPreviewLightboxProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const lines: OrderItemLine[] = item.lines || [];
  const price = Number(item.unitPrice || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const postCommentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/orders/${orderId}/product-comments`, {
        orderItemId: item.id,
        content: commentText,
      });
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/product-comments`] });
      toast({ title: "Comment posted" });
    },
    onError: () => toast({ title: "Failed to post comment", variant: "destructive" }),
  });

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 [&>button.absolute]:hidden">
        {/* Header banner */}
        <div className="bg-gray-800 text-white px-6 py-4 flex items-center gap-3 rounded-t-lg">
          <div>
            <h3 className="font-bold text-lg">{companyName}</h3>
            <p className="text-gray-300 text-sm">Product Detail</p>
          </div>
          <Button variant="ghost" size="sm" className="ml-auto text-white hover:bg-gray-700" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Left - Image */}
          <div>
            <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.productName || ""} className="w-full h-full object-contain p-6" />
              ) : (
                <Package className="w-24 h-24 text-gray-200" />
              )}
            </div>
          </div>

          {/* Right - Details */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">{item.productName}</h2>
              {item.productSku && <p className="text-sm text-gray-400">SKU: {item.productSku}</p>}
              {item.brand && <p className="text-sm text-gray-500">{item.brand}</p>}
            </div>

            {item.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
            )}

            {/* Pricing Table */}
            {!hidePricing && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Pricing</h4>
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 gap-0">
                    <div className="px-3 py-1.5 bg-gray-50 border-b border-r text-xs font-semibold text-gray-500">Qty</div>
                    <div className="px-3 py-1.5 bg-gray-50 border-b text-xs font-semibold text-gray-500">Price</div>
                    {lines.length > 0 ? (
                      lines.map((line: OrderItemLine) => (
                        <div key={line.id} className="contents">
                          <div className="px-3 py-1.5 border-b border-r text-sm">{line.quantity}</div>
                          <div className="px-3 py-1.5 border-b text-sm font-medium">${Number(line.unitPrice || 0).toFixed(2)}</div>
                        </div>
                      ))
                    ) : (
                      <div className="contents">
                        <div className="px-3 py-1.5 border-b border-r text-sm">{item.quantity}</div>
                        <div className="px-3 py-1.5 border-b text-sm font-medium">${price.toFixed(2)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Colors */}
            {item.colors && item.colors.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Colors</h4>
                <p className="text-sm text-gray-600">{item.colors.join(" · ")}</p>
              </div>
            )}

            {/* Sizes */}
            {item.sizes && item.sizes.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Sizes</h4>
                <p className="text-sm text-gray-600 uppercase">{item.sizes.join(" · ")}</p>
              </div>
            )}

            {/* Comments Section */}
            <div className="pt-2 border-t">
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 w-full py-2 text-sm font-medium text-teal-700 hover:text-teal-800"
              >
                <MessageSquare className="w-4 h-4" />
                {comments.length > 0 ? `Comments (${comments.length})` : "Add a Comment"}
              </button>

              {showComments && (
                <div className="space-y-3 mt-2">
                  {comments.map((c: any) => (
                    <div key={c.id} className={`p-3 rounded-lg text-sm ${c.isClient ? "bg-blue-50" : "bg-yellow-50"}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-xs">{c.isClient ? c.clientName || "Client" : "You"}</span>
                        <span className="text-xs text-gray-400">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <p className="text-gray-700">{c.content}</p>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add your comment..."
                      className="min-h-[60px] resize-none text-sm flex-1"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="w-full gap-1 bg-teal-600 hover:bg-teal-700"
                    onClick={() => postCommentMutation.mutate()}
                    disabled={!commentText.trim() || postCommentMutation.isPending}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {postCommentMutation.isPending ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
