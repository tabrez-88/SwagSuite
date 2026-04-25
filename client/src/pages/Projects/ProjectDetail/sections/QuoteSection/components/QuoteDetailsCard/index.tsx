import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import EditableAddress from "@/components/shared/EditableAddress";
import { Calculator, ClipboardList, Loader2, MapPin, Pencil } from "lucide-react";
import { format } from "date-fns";
import type { Order } from "@shared/schema";
import { useQuoteDetailsCard } from "./hooks";

interface QuoteDetailsCardProps {
  projectId: string;
  order: Order;
  isLocked: boolean;
  onEditClick: () => void;
  updateField: (fields: Record<string, unknown>, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void;
  isFieldPending: boolean;
  primaryContact: Record<string, unknown> | null | undefined;
}

export default function QuoteDetailsCard({
  projectId,
  order,
  isLocked,
  onEditClick,
  updateField,
  isFieldPending,
  primaryContact,
}: QuoteDetailsCardProps) {
  const editableContact = primaryContact ? {
    firstName: (primaryContact.firstName as string) ?? undefined,
    lastName: (primaryContact.lastName as string) ?? undefined,
    email: (primaryContact.email as string) ?? undefined,
    phone: (primaryContact.phone as string) ?? undefined,
  } : null;
  const { calculateTaxMutation, taxCodes } = useQuoteDetailsCard({ projectId });

  const activeTaxCode = taxCodes?.find((tc) => String(tc.id) === order?.defaultTaxCodeId);
  const taxAmount = Number(order?.tax || 0);

  return (
    <>
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Quote Details
            </CardTitle>
            {!isLocked && (
              <Button variant="outline" size="sm" className="h-8" onClick={onEditClick}>
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Quote Date</span>
              <span className="text-sm font-medium">
                {order?.createdAt
                  ? format(new Date(String(order.createdAt)), "MMM d, yyyy")
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">In-Hands Date</span>
              <span className="text-sm font-medium">
                {order?.inHandsDate ? format(new Date(String(order.inHandsDate)), "MMM d, yyyy") : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Supplier In-Hands</span>
              <span className="text-sm font-medium">
                {order?.supplierInHandsDate ? format(new Date(String(order.supplierInHandsDate)), "MMM d, yyyy") : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Customer PO</span>
              <span className="text-sm font-medium">{order?.customerPo || "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Payment Terms</span>
              <span className="text-sm font-medium">{order?.paymentTerms || "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Currency</span>
              <span className="text-sm font-medium">{order?.currency || "USD"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tax Code</span>
              <span className="text-sm font-medium">
                {activeTaxCode?.label || "None"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tax</span>
              <div className="flex items-center gap-2">
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
          </div>
          <Separator className="my-2" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="col-span-2">
              <p className="text-xs font-medium text-gray-500 mb-1">Introduction</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{order?.quoteIntroduction || <span className="text-gray-400 italic">No introduction</span>}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Supplier Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{order?.supplierNotes || <span className="text-gray-400 italic">No supplier notes</span>}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Additional Information</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{order?.additionalInformation || <span className="text-gray-400 italic">No additional info</span>}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EditableAddress
          title="Billing Address"
          addressJson={order?.billingAddress}
          field="billingAddress"
          onSave={updateField}
          isLocked={isLocked}
          isPending={isFieldPending}
          icon={<MapPin className="w-4 h-4" />}
          companyId={order?.companyId}
          primaryContact={editableContact}
        />
        <EditableAddress
          title="Shipping Address"
          addressJson={order?.shippingAddress}
          field="shippingAddress"
          onSave={updateField}
          isLocked={isLocked}
          isPending={isFieldPending}
          icon={<MapPin className="w-4 h-4" />}
          companyId={order?.companyId}
          primaryContact={editableContact}
          billingAddressJson={order?.billingAddress}
        />
      </div>
    </>
  );
}
