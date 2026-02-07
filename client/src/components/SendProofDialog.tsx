import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Copy, CheckCircle } from "lucide-react";

interface OrderFile {
  id: string;
  fileName: string;
  originalName: string;
  filePath: string;
  orderItemId?: string;
  orderItem?: {
    productName: string;
    color?: string;
    size?: string;
  };
}

interface SendProofDialogProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  file: OrderFile;
}

export function SendProofDialog({
  open,
  onClose,
  orderId,
  file,
}: SendProofDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [clientEmail, setClientEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [message, setMessage] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const sendProofMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/orders/${orderId}/send-proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: file.id,
          orderItemId: file.orderItemId,
          clientEmail,
          clientName,
          message,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedLink(data.approvalUrl);
      toast({
        title: "Proof sent successfully",
        description: `Approval link has been generated${clientEmail ? " and sent to " + clientEmail : ""}`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/approvals`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send proof",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link copied",
      description: "Approval link copied to clipboard",
    });
  };

  const handleClose = () => {
    setClientEmail("");
    setClientName("");
    setMessage("");
    setGeneratedLink("");
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Proof to Customer</DialogTitle>
          <p className="text-sm text-gray-500">
            Generate an approval link for: <span className="font-medium">{file.originalName}</span>
            {file.orderItem && (
              <span className="block mt-1">
                Product: {file.orderItem.productName}
                {file.orderItem.color && ` - ${file.orderItem.color}`}
                {file.orderItem.size && ` (${file.orderItem.size})`}
              </span>
            )}
          </p>
        </DialogHeader>

        {!generatedLink ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="client@company.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Optional: Email will be sent automatically if provided
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                placeholder="John Doe"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Please review and approve this artwork proof..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={() => sendProofMutation.mutate()}
                disabled={sendProofMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {sendProofMutation.isPending ? "Generating..." : "Generate Approval Link"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-900">Approval link generated!</p>
                  <p className="text-sm text-green-700 mt-1">
                    {clientEmail
                      ? `An email has been sent to ${clientEmail} with the approval link.`
                      : "Share the link below with your customer."}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Approval Link</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={handleCopyLink}
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Close</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
