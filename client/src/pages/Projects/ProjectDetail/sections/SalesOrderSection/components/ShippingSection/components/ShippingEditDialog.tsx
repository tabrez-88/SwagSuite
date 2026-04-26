import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Package, Save } from "lucide-react";
import type { ItemShippingFormData, ShippingAddressData } from "../types";
import {
  ACCOUNT_TYPE_OPTIONS,
  SHIP_TO_OPTIONS,
  SHIPPING_METHOD_OPTIONS,
} from "../types";
import type { ShippingAccount } from "@/services/shipping-accounts";
import type { ShippingMethod } from "@/services/shipping-methods";

const getShipToLabel = (dest: string) => SHIP_TO_OPTIONS.find(o => o.value === dest)?.label || dest || "--";

interface ShippingAccountWithSource extends ShippingAccount {
  source: "org" | "client";
}

interface ShippingEditDialogProps {
  open: boolean;
  onClose: () => void;
  itemName: string;
  form: ItemShippingFormData;
  setForm: React.Dispatch<React.SetStateAction<ItemShippingFormData>>;
  onSave: () => void;
  isSaving: boolean;
  companyAddresses: any[];
  supplierAddresses: any[];
  selectStoredAddress: (addr: any, leg: "leg1" | "leg2") => void;
  updateAddressField: (leg: "leg1" | "leg2", field: keyof ShippingAddressData, value: string) => void;
  handleDestinationChange: (dest: string) => void;
  handleLeg2ShipToChange: (shipTo: string) => void;
  allShippingAccounts?: ShippingAccountWithSource[];
  filteredMethods?: ShippingMethod[];
}

export function ShippingEditDialog({
  open,
  onClose,
  itemName,
  form,
  setForm,
  onSave,
  isSaving,
  companyAddresses,
  supplierAddresses,
  selectStoredAddress,
  updateAddressField,
  handleDestinationChange,
  handleLeg2ShipToChange,
  allShippingAccounts = [],
  filteredMethods = [],
}: ShippingEditDialogProps) {
  const showAccountPicker = form.shippingAccountType === "ours";
  const showLeg2AccountPicker = form.leg2ShippingAccountType === "ours";
  const usesDynamicMethods = filteredMethods.length > 0;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Shipping Config — {itemName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* LEG 1 */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">
              Leg 1: To {getShipToLabel(form.shippingDestination) || "Destination"}
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ship To *</Label>
                <Select value={form.shippingDestination} onValueChange={handleDestinationChange}>
                  <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
                  <SelectContent>
                    {SHIP_TO_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Account Type</Label>
                <Select value={form.shippingAccountType}
                  onValueChange={(v) => setForm(f => ({ ...f, shippingAccountType: v, shippingAccountId: "" }))}>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Shipping Account picker (when account type = ours or client) */}
            {showAccountPicker && allShippingAccounts.length > 0 && (
              <div>
                <Label>Shipping Account</Label>
                <Select value={form.shippingAccountId}
                  onValueChange={(v) => setForm(f => ({ ...f, shippingAccountId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select shipping account..." /></SelectTrigger>
                  <SelectContent>
                    {allShippingAccounts
                      .filter((a) => a.source === "org")
                      .map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.accountName} ({a.courier.toUpperCase()}) — {a.accountNumber}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Address Picker */}
            <div>
              <Label>Address</Label>
              {(() => {
                const addresses = form.shippingDestination === "client" ? companyAddresses : supplierAddresses;
                return addresses.length > 0 ? (
                  <Select value={form.shipToAddressId}
                    onValueChange={(v) => {
                      const addr = addresses.find((a: any) => a.id === v);
                      if (addr) selectStoredAddress(addr, "leg1");
                    }}>
                    <SelectTrigger className="mb-2"><SelectValue placeholder="Select from saved addresses..." /></SelectTrigger>
                    <SelectContent>
                      {addresses.map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.addressName || a.companyNameOnDocs || "Address"} — {[a.street, a.city, a.state].filter(Boolean).join(", ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null;
              })()}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Input className="h-7 text-xs" placeholder="Street" value={form.shipToAddress?.street || ""}
                  onChange={(e) => updateAddressField("leg1", "street", e.target.value)} />
                <Input className="h-7 text-xs" placeholder="Street 2" value={form.shipToAddress?.street2 || ""}
                  onChange={(e) => updateAddressField("leg1", "street2", e.target.value)} />
                <Input className="h-7 text-xs" placeholder="City" value={form.shipToAddress?.city || ""}
                  onChange={(e) => updateAddressField("leg1", "city", e.target.value)} />
                <Input className="h-7 text-xs" placeholder="State" value={form.shipToAddress?.state || ""}
                  onChange={(e) => updateAddressField("leg1", "state", e.target.value)} />
                <Input className="h-7 text-xs" placeholder="Zip Code" value={form.shipToAddress?.zipCode || ""}
                  onChange={(e) => updateAddressField("leg1", "zipCode", e.target.value)} />
                <Input className="h-7 text-xs" placeholder="Country" value={form.shipToAddress?.country || ""}
                  onChange={(e) => updateAddressField("leg1", "country", e.target.value)} />
                <Input className="h-7 text-xs" placeholder="Contact Name" value={form.shipToAddress?.contactName || ""}
                  onChange={(e) => updateAddressField("leg1", "contactName", e.target.value)} />
                <Input className="h-7 text-xs" placeholder="Phone" value={form.shipToAddress?.phone || ""}
                  onChange={(e) => updateAddressField("leg1", "phone", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Supplier In-Hands Date</Label>
                <Input type="date" value={form.shipInHandsDate}
                  onChange={(e) => setForm(f => ({ ...f, shipInHandsDate: e.target.value }))} />
              </div>
              <div className="flex items-end gap-2 pb-0.5">
                <Checkbox checked={form.shipFirm ?? false}
                  onCheckedChange={(c) => setForm(f => ({ ...f, shipFirm: !!c }))} />
                <Label className="font-normal text-sm">Firm</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Shipping Method</Label>
                <Select value={form.shippingMethodOverride}
                  onValueChange={(v) => setForm(f => ({ ...f, shippingMethodOverride: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    {usesDynamicMethods
                      ? filteredMethods.map(m => <SelectItem key={m.id} value={m.name}>{m.name} ({m.courier.toUpperCase()})</SelectItem>)
                      : SHIPPING_METHOD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)
                    }
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={form.shippingNotes}
                  onChange={(e) => setForm(f => ({ ...f, shippingNotes: e.target.value }))} placeholder="Supplier notes..." />
              </div>
            </div>
          </div>

          {/* LEG 2 (only for decorator) */}
          {form.shippingDestination === "decorator" && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-semibold text-purple-700">
                Leg 2: Decorator → {getShipToLabel(form.leg2ShipTo)}
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ship To</Label>
                  <Select value={form.leg2ShipTo} onValueChange={handleLeg2ShipToChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="fulfillment">Fulfillment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Account Type</Label>
                  <Select value={form.leg2ShippingAccountType}
                    onValueChange={(v) => setForm(f => ({ ...f, leg2ShippingAccountType: v, leg2ShippingAccountId: "" }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Leg 2 Shipping Account picker */}
              {showLeg2AccountPicker && allShippingAccounts.length > 0 && (
                <div>
                  <Label>Shipping Account</Label>
                  <Select value={form.leg2ShippingAccountId}
                    onValueChange={(v) => setForm(f => ({ ...f, leg2ShippingAccountId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select shipping account..." /></SelectTrigger>
                    <SelectContent>
                      {allShippingAccounts
                        .filter((a) => a.source === "org")
                        .map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.accountName} ({a.courier.toUpperCase()}) — {a.accountNumber}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Leg 2 Address Picker */}
              <div>
                <Label>Delivery Address</Label>
                {companyAddresses.length > 0 && (
                  <Select value={form.leg2AddressId}
                    onValueChange={(v) => {
                      const addr = companyAddresses.find((a: any) => a.id === v);
                      if (addr) selectStoredAddress(addr, "leg2");
                    }}>
                    <SelectTrigger className="mb-2"><SelectValue placeholder="Select from saved addresses..." /></SelectTrigger>
                    <SelectContent>
                      {companyAddresses.map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.addressName || "Address"} — {[a.street, a.city, a.state].filter(Boolean).join(", ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Input className="h-7 text-xs" placeholder="Street" value={form.leg2Address?.street || ""}
                    onChange={(e) => updateAddressField("leg2", "street", e.target.value)} />
                  <Input className="h-7 text-xs" placeholder="City" value={form.leg2Address?.city || ""}
                    onChange={(e) => updateAddressField("leg2", "city", e.target.value)} />
                  <Input className="h-7 text-xs" placeholder="State" value={form.leg2Address?.state || ""}
                    onChange={(e) => updateAddressField("leg2", "state", e.target.value)} />
                  <Input className="h-7 text-xs" placeholder="Zip Code" value={form.leg2Address?.zipCode || ""}
                    onChange={(e) => updateAddressField("leg2", "zipCode", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Supplier In-Hands Date</Label>
                  <Input type="date" value={form.leg2InHandsDate}
                    onChange={(e) => setForm(f => ({ ...f, leg2InHandsDate: e.target.value }))} />
                </div>
                <div className="flex items-end gap-2 pb-0.5">
                  <Checkbox checked={form.leg2Firm ?? false}
                    onCheckedChange={(c) => setForm(f => ({ ...f, leg2Firm: !!c }))} />
                  <Label className="font-normal text-sm">Firm</Label>
                </div>
                <div>
                  <Label>Method</Label>
                  <Select value={form.leg2ShippingMethod}
                    onValueChange={(v) => setForm(f => ({ ...f, leg2ShippingMethod: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {usesDynamicMethods
                        ? filteredMethods.map(m => <SelectItem key={m.id} value={m.name}>{m.name} ({m.courier.toUpperCase()})</SelectItem>)
                        : SHIPPING_METHOD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
