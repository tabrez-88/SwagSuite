import EditableAddress from "@/components/shared/EditableAddress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Order } from "@shared/schema";
import { Calculator, ClipboardList, CreditCard, Loader2, MapPin, Pencil } from "lucide-react";
import { format } from "date-fns";
import { useOrderInfoCard } from "./hooks";

interface OrderInfoCardProps {
  projectId: string;
  order: Order;
  isLocked: boolean;
  onEditClick: () => void;
  updateField: (fields: Record<string, unknown>) => void;
  isFieldPending: boolean;
  primaryContact: { firstName?: string; lastName?: string; email?: string } | null | undefined;
}

export default function OrderInfoCard({
  projectId,
  order,
  isLocked,
  onEditClick,
  updateField,
  isFieldPending,
  primaryContact,
}: OrderInfoCardProps) {
  const { calculateTaxMutation, taxCodes } = useOrderInfoCard({ projectId });

  return (
    <>
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Order Details
            </CardTitle>
            {!isLocked && (
              <Button variant="outline" size="sm" className="h-8" onClick={onEditClick}>
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Introduction / Notes */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Introduction</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes || <span className="text-gray-400 italic">No introduction</span>}</p>
          </div>

          {/* Terms, Dates, Firm */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Payment Terms</span>
              <span className="text-sm font-medium">{order.paymentTerms || "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Customer PO</span>
              <span className="text-sm font-medium">{order.customerPo || "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Default Margin</span>
              <span className="text-sm font-medium">{order.margin ? `${order.margin}%` : "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Discount</span>
              <span className="text-sm font-medium">{order.orderDiscount ? `${order.orderDiscount}%` : "—"}</span>
            </div>
            {order.depositPercent && Number(order.depositPercent) > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Deposit</span>
                <span className="text-sm font-medium">
                  {String(order.depositPercent)}% (${Number(order.depositAmount || 0).toLocaleString()})
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tax Code</span>
              <span className="text-sm font-medium">
                {taxCodes?.find((tc) => String(tc.id) === order.defaultTaxCodeId)?.label || "None"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tax</span>
              <div className="flex items-center gap-2">
                {(() => {
                  const taxAmount = Number(order.tax || 0);
                  const activeTaxCode = taxCodes?.find((tc) => String(tc.id) === order.defaultTaxCodeId);
                  return (
                    <>
                      <span className={`text-sm font-medium ${taxAmount > 0 ? "text-amber-700" : ""}`}>
                        ${taxAmount.toFixed(2)}
                      </span>
                      {activeTaxCode && !activeTaxCode.isExempt && taxAmount > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-amber-50 text-amber-700 border-amber-200">
                          {activeTaxCode.rate}%
                        </Badge>
                      )}
                      {activeTaxCode?.isExempt && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-green-50 text-green-700 border-green-200">
                          Exempt
                        </Badge>
                      )}
                    </>
                  );
                })()}
                {!isLocked && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => calculateTaxMutation.mutate()}
                    disabled={calculateTaxMutation.isPending}
                  >
                    {calculateTaxMutation.isPending ? (
                      <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    ) : (
                      <Calculator className="h-3 w-3 mr-1.5" />
                    )}
                    Calculate Tax
                  </Button>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">In-Hands Date</span>
              <span className="text-sm font-medium">
                {order.inHandsDate ? format(new Date(String(order.inHandsDate)), "MMM d, yyyy") : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Event Date</span>
              <span className="text-sm font-medium">
                {order.eventDate ? format(new Date(String(order.eventDate)), "MMM d, yyyy") : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Supplier In-Hands</span>
              <span className="text-sm font-medium">
                {order.supplierInHandsDate ? format(new Date(String(order.supplierInHandsDate)), "MMM d, yyyy") : "—"}
              </span>
            </div>
          </div>

          {/* Firm / Rush badges */}
          <div className="flex items-center gap-3">
            {!!order.isFirm && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Firm Order</Badge>
            )}
            {!!order.isRush && (
              <Badge variant="destructive" className="text-xs">Rush Order</Badge>
            )}
          </div>

          {/* Supplier Notes & Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Supplier Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.supplierNotes || <span className="text-gray-400 italic">No supplier notes</span>}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Additional Information</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.additionalInformation || <span className="text-gray-400 italic">No additional info</span>}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EditableAddress
          title="Billing Address"
          addressJson={order.billingAddress as string | null | undefined}
          field="billingAddress"
          onSave={updateField}
          isLocked={isLocked}
          isPending={isFieldPending}
          icon={<CreditCard className="w-4 h-4" />}
          companyId={order.companyId as string | null | undefined}
          primaryContact={primaryContact}
        />
        <EditableAddress
          title="Shipping Address"
          addressJson={order.shippingAddress as string | null | undefined}
          field="shippingAddress"
          onSave={updateField}
          isLocked={isLocked}
          isPending={isFieldPending}
          icon={<MapPin className="w-4 h-4" />}
          companyId={order.companyId as string | null | undefined}
          primaryContact={primaryContact}
          billingAddressJson={order.billingAddress as string | null | undefined}
        />
      </div>
    </>
  );
}
