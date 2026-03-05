import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/UserAvatar";
import { RichTextEditor } from "@/components/RichTextEditor";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Store, Send, Clock, Eye, Edit, Package, Zap, Factory, MessageSquare } from "lucide-react";
import type { ProjectData } from "@/types/project-types";

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

interface VendorSectionProps {
  orderId: string;
  data: ProjectData;
}

export default function VendorSection({ orderId, data }: VendorSectionProps) {
  const { order, orderVendors, vendorCommunications, orderItems } = data;
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [vendorEmailTo, setVendorEmailTo] = useState("");
  const [vendorEmailToName, setVendorEmailToName] = useState("");
  const [vendorEmailFrom, setVendorEmailFrom] = useState("");
  const [vendorEmailFromName, setVendorEmailFromName] = useState("");
  const [vendorEmailSubject, setVendorEmailSubject] = useState("");
  const [vendorEmailBody, setVendorEmailBody] = useState("");
  const [vendorEmailCc, setVendorEmailCc] = useState("");
  const [vendorEmailBcc, setVendorEmailBcc] = useState("");
  const [previewMode, setPreviewMode] = useState<"compose" | "preview">("compose");

  // Set first vendor as default
  useEffect(() => {
    if (orderVendors.length > 0 && !selectedVendor) {
      setSelectedVendor(orderVendors[0]);
    }
  }, [orderVendors, selectedVendor]);

  // Fetch vendor contacts
  const { data: vendorContacts = [] } = useQuery<any[]>({
    queryKey: [`/api/contacts`, { supplierId: selectedVendor?.id }],
    queryFn: async () => {
      if (!selectedVendor?.id) return [];
      const response = await fetch(`/api/contacts?supplierId=${selectedVendor.id}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedVendor?.id,
  });

  const vendorPrimaryContact = vendorContacts.find((c: any) => c.isPrimary) || vendorContacts[0];

  // Auto-fill vendor email
  useEffect(() => {
    if (selectedVendor && vendorPrimaryContact) {
      setVendorEmailTo(vendorPrimaryContact.email || "");
      setVendorEmailToName(
        `${vendorPrimaryContact.firstName || ""} ${vendorPrimaryContact.lastName || ""}`.trim() || selectedVendor.name,
      );
    } else if (selectedVendor) {
      setVendorEmailTo("");
      setVendorEmailToName(selectedVendor.name || "");
    }
  }, [selectedVendor, vendorPrimaryContact]);

  // Auto-fill from
  useEffect(() => {
    if (currentUser && !vendorEmailFrom) {
      setVendorEmailFrom((currentUser as any).email || "");
      setVendorEmailFromName(
        `${(currentUser as any).firstName || ""} ${(currentUser as any).lastName || ""}`.trim(),
      );
    }
  }, [currentUser, vendorEmailFrom]);

  const sendVendorEmailMutation = useMutation({
    mutationFn: async (emailData: any) => {
      const response = await fetch(`/api/orders/${order?.id}/communications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communicationType: "vendor_email",
          direction: "sent",
          fromEmail: emailData.fromEmail,
          fromName: emailData.fromName,
          recipientEmail: emailData.recipientEmail,
          recipientName: emailData.recipientName,
          subject: emailData.subject,
          body: emailData.body,
          cc: emailData.cc,
          bcc: emailData.bcc,
          metadata: { vendorId: selectedVendor?.id, vendorName: selectedVendor?.name },
        }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Failed to send email");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/orders/${orderId}/communications`, { type: "vendor_email" }],
      });
      toast({ title: "Email sent", description: "Vendor email has been sent successfully." });
      setVendorEmailSubject("");
      setVendorEmailBody("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSend = () => {
    if (!vendorEmailTo || !vendorEmailSubject || !vendorEmailBody) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    sendVendorEmailMutation.mutate({
      fromEmail: vendorEmailFrom,
      fromName: vendorEmailFromName,
      recipientEmail: vendorEmailTo,
      recipientName: vendorEmailToName,
      subject: vendorEmailSubject,
      body: vendorEmailBody,
      cc: vendorEmailCc,
      bcc: vendorEmailBcc,
    });
  };

  // Email templates
  const applyTemplate = (template: string) => {
    const orderNum = (order as any)?.orderNumber || "";
    switch (template) {
      case "production":
        setVendorEmailSubject(`Production Start Request - Order #${orderNum}`);
        setVendorEmailBody(`<p>Hi ${vendorEmailToName},</p><p>We would like to start production on Order #${orderNum}. Please confirm the production timeline and expected ship date.</p><p>Thank you.</p>`);
        break;
      case "status":
        setVendorEmailSubject(`Status Check - Order #${orderNum}`);
        setVendorEmailBody(`<p>Hi ${vendorEmailToName},</p><p>Could you please provide an update on the status of Order #${orderNum}?</p><p>Thank you.</p>`);
        break;
      case "artwork":
        setVendorEmailSubject(`Artwork - Order #${orderNum}`);
        setVendorEmailBody(`<p>Hi ${vendorEmailToName},</p><p>Please find the artwork for Order #${orderNum} attached. Let us know if you need any revisions.</p><p>Thank you.</p>`);
        break;
      case "rush":
        setVendorEmailSubject(`RUSH Request - Order #${orderNum}`);
        setVendorEmailBody(`<p>Hi ${vendorEmailToName},</p><p>We need to rush Order #${orderNum}. Please confirm if you can accommodate expedited production and shipping.</p><p>Thank you.</p>`);
        break;
    }
  };

  // Get vendor products
  const vendorProducts = selectedVendor
    ? orderItems.filter((item: any) => item.supplierId === selectedVendor.id)
    : [];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Store className="w-5 h-5" />
        Vendor Communication
      </h2>

      {orderVendors.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No vendors on this order</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Vendor Selector */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Label className="flex-shrink-0">Select Vendor:</Label>
                <Select
                  value={selectedVendor?.id || ""}
                  onValueChange={(id) => {
                    const vendor = orderVendors.find((v: any) => v.id === id);
                    setSelectedVendor(vendor);
                  }}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a vendor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {orderVendors.map((vendor: any) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedVendor && (
                  <div className="text-sm text-gray-500">
                    {vendorProducts.length} product(s)
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vendor Products */}
          {selectedVendor && vendorProducts.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Products from {selectedVendor.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {vendorProducts.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                      <span>{item.productName || "Product"}</span>
                      <span className="text-gray-500">
                        {item.color && `${item.color} · `}Qty: {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Templates */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => applyTemplate("production")}>
              <Factory className="w-3 h-3 mr-1" />
              Production Start
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyTemplate("status")}>
              <MessageSquare className="w-3 h-3 mr-1" />
              Status Check
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyTemplate("artwork")}>
              <Package className="w-3 h-3 mr-1" />
              Send Artwork
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyTemplate("rush")}>
              <Zap className="w-3 h-3 mr-1" />
              Rush Request
            </Button>
          </div>

          {/* Compose Email */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Compose Vendor Email</CardTitle>
                <div className="flex gap-1">
                  <Button variant={previewMode === "compose" ? "default" : "ghost"} size="sm" onClick={() => setPreviewMode("compose")}>
                    <Edit className="w-3 h-3 mr-1" />Compose
                  </Button>
                  <Button variant={previewMode === "preview" ? "default" : "ghost"} size="sm" onClick={() => setPreviewMode("preview")}>
                    <Eye className="w-3 h-3 mr-1" />Preview
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {previewMode === "compose" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>To</Label>
                      <Input value={vendorEmailTo} onChange={(e) => setVendorEmailTo(e.target.value)} />
                    </div>
                    <div>
                      <Label>To Name</Label>
                      <Input value={vendorEmailToName} onChange={(e) => setVendorEmailToName(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>From</Label>
                      <Input value={vendorEmailFrom} onChange={(e) => setVendorEmailFrom(e.target.value)} />
                    </div>
                    <div>
                      <Label>From Name</Label>
                      <Input value={vendorEmailFromName} onChange={(e) => setVendorEmailFromName(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>CC</Label>
                      <Input value={vendorEmailCc} onChange={(e) => setVendorEmailCc(e.target.value)} placeholder="Optional" />
                    </div>
                    <div>
                      <Label>BCC</Label>
                      <Input value={vendorEmailBcc} onChange={(e) => setVendorEmailBcc(e.target.value)} placeholder="Optional" />
                    </div>
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <Input value={vendorEmailSubject} onChange={(e) => setVendorEmailSubject(e.target.value)} />
                  </div>
                  <div>
                    <Label>Body</Label>
                    <RichTextEditor value={vendorEmailBody} onChange={setVendorEmailBody} />
                  </div>
                </>
              ) : (
                <div className="border rounded-lg p-4 bg-white">
                  <div className="text-sm space-y-2 mb-4">
                    <p><strong>To:</strong> {vendorEmailToName} &lt;{vendorEmailTo}&gt;</p>
                    <p><strong>From:</strong> {vendorEmailFromName} &lt;{vendorEmailFrom}&gt;</p>
                    <p><strong>Subject:</strong> {vendorEmailSubject}</p>
                  </div>
                  <Separator />
                  <div className="mt-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: vendorEmailBody }} />
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={handleSend} disabled={sendVendorEmailMutation.isPending}>
                  <Send className="w-4 h-4 mr-2" />
                  {sendVendorEmailMutation.isPending ? "Sending..." : "Send to Vendor"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Vendor Communications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Vendor Communications</CardTitle>
            </CardHeader>
            <CardContent>
              {vendorCommunications.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No vendor communications yet</p>
              ) : (
                <div className="space-y-3">
                  {vendorCommunications.map((comm) => (
                    <div key={comm.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <UserAvatar name={`${comm.user.firstName} ${comm.user.lastName}`} size="sm" />
                          <span className="text-sm font-medium">{comm.user.firstName} {comm.user.lastName}</span>
                          {comm.metadata?.vendorName && (
                            <Badge variant="outline" className="text-xs">{comm.metadata.vendorName}</Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(comm.createdAt), "MMM dd, h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{comm.subject}</p>
                      <p className="text-xs text-gray-500">To: {comm.recipientName || comm.recipientEmail}</p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{stripHtml(comm.body)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
