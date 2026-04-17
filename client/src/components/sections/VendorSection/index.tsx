import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { format } from "date-fns";
import { Store, Clock, Package, Zap, Factory, MessageSquare } from "lucide-react";
import EmailComposer from "@/components/email/EmailComposer";
import { useVendorSection, stripHtml } from "./hooks";
import type { VendorSectionProps } from "./types";

export default function VendorSection({ projectId, data }: VendorSectionProps) {
  const h = useVendorSection(projectId, data);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Store className="w-5 h-5" />
        Vendor Communication
      </h2>

      {h.orderVendors.length === 0 ? (
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
                  value={h.selectedVendor?.id || ""}
                  onValueChange={(id) => {
                    const vendor = h.orderVendors.find((v: any) => v.id === id);
                    h.setSelectedVendor(vendor);
                  }}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a vendor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {h.orderVendors.map((vendor: any) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {h.selectedVendor && (
                  <div className="text-sm text-gray-500">
                    {h.vendorProducts.length} product(s)
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vendor Products */}
          {h.selectedVendor && h.vendorProducts.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Products from {h.selectedVendor.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {h.vendorProducts.map((item: any) => (
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
            <Button variant="outline" size="sm" onClick={() => h.applyTemplate("production")}>
              <Factory className="w-3 h-3 mr-1" />
              Production Start
            </Button>
            <Button variant="outline" size="sm" onClick={() => h.applyTemplate("status")}>
              <MessageSquare className="w-3 h-3 mr-1" />
              Status Check
            </Button>
            <Button variant="outline" size="sm" onClick={() => h.applyTemplate("artwork")}>
              <Package className="w-3 h-3 mr-1" />
              Send Artwork
            </Button>
            <Button variant="outline" size="sm" onClick={() => h.applyTemplate("rush")}>
              <Zap className="w-3 h-3 mr-1" />
              Rush Request
            </Button>
          </div>

          {/* Compose Email */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Compose Vendor Email</CardTitle>
            </CardHeader>
            <CardContent>
              <EmailComposer
                ref={h.composerRef}
                contacts={h.vendorContactsList.length > 0 ? h.vendorContactsList : undefined}
                defaults={{
                  to: h.vendorPrimaryContact?.email || "",
                  toName: h.vendorPrimaryContact
                    ? `${h.vendorPrimaryContact.firstName || ""} ${h.vendorPrimaryContact.lastName || ""}`.trim() || h.selectedVendor?.name
                    : h.selectedVendor?.name || "",
                }}
                showAdvancedFields
                showPreview
                showAttachments
                contextProjectId={projectId}
                autoFillSender
                onSend={(data) => h.sendVendorEmailMutation.mutate(data)}
                isSending={h.sendVendorEmailMutation.isPending}
                sendLabel="Send to Vendor"
              />
            </CardContent>
          </Card>

          {/* Recent Vendor Communications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Vendor Communications</CardTitle>
            </CardHeader>
            <CardContent>
              {h.vendorCommunications.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No vendor communications yet</p>
              ) : (
                <div className="space-y-3">
                  {h.vendorCommunications.map((comm) => (
                    <div key={comm.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <UserAvatar name={`${comm.user.firstName} ${comm.user.lastName}`} size="sm" />
                          <span className="text-sm font-medium">{comm.user.firstName} {comm.user.lastName}</span>
                          {typeof comm.metadata?.vendorName === "string" && (
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
