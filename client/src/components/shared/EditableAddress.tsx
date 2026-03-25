import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Pencil, Check, X, Loader2, Building } from "lucide-react";
import { useCompanyAddresses, type CompanyAddress } from "@/services/company-addresses";

function normalizeCountryCode(country: string): string {
  if (!country) return "US";
  const c = country.trim().toUpperCase();
  if (c === "US" || c === "CA" || c === "MX") return c;
  const mapping: Record<string, string> = {
    USA: "US", "U.S.": "US", "U.S.A.": "US", "UNITED STATES": "US", "UNITED STATES OF AMERICA": "US",
    CANADA: "CA", CAN: "CA", MEXICO: "MX", MEX: "MX", "MÉXICO": "MX",
  };
  return mapping[c] || "US";
}

export interface AddressData {
  contactName?: string;
  email?: string;
  street?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
}

interface EditableAddressProps {
  title: string;
  addressJson: string | null | undefined;
  field: "billingAddress" | "shippingAddress";
  onSave: (fields: Record<string, any>) => void;
  isLocked?: boolean;
  isPending?: boolean;
  icon?: React.ReactNode;
  /** Company ID — used to fetch company addresses for the picker */
  companyId?: string | null;
  /** Primary contact name/email for pre-filling contact info */
  primaryContact?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  } | null;
  /** Billing address JSON — when provided on a shipping card, enables "Same as Billing" */
  billingAddressJson?: string | null;
}

function parseAddress(json: string | null | undefined): AddressData {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch {
    return { street: json };
  }
}

export default function EditableAddress({
  title,
  addressJson,
  field,
  onSave,
  isLocked = false,
  isPending = false,
  icon,
  companyId,
  primaryContact,
  billingAddressJson,
}: EditableAddressProps) {
  const [editing, setEditing] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const addr = parseAddress(addressJson);

  // Fetch company addresses for the picker
  const { data: companyAddresses = [] } = useCompanyAddresses(companyId || undefined);

  // Filter addresses by type based on field
  const relevantAddresses = companyAddresses.filter((a) => {
    if (field === "billingAddress") return a.addressType === "billing" || a.addressType === "both";
    return a.addressType === "shipping" || a.addressType === "both";
  });

  const [formData, setFormData] = useState({
    contactName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    phone: "",
  });

  // Fill form from a company address
  const fillFromCompanyAddress = (companyAddr: CompanyAddress) => {
    const contactFullName = primaryContact
      ? [primaryContact.firstName, primaryContact.lastName].filter(Boolean).join(" ")
      : "";
    setFormData({
      contactName: companyAddr.companyNameOnDocs || formData.contactName || contactFullName,
      email: primaryContact?.email || formData.email || "",
      street: companyAddr.street || "",
      city: companyAddr.city || "",
      state: companyAddr.state || "",
      zipCode: companyAddr.zipCode || "",
      country: normalizeCountryCode(companyAddr.country || "US"),
      phone: primaryContact?.phone || formData.phone || "",
    });
    setSameAsBilling(false);
  };

  useEffect(() => {
    if (editing) {
      const hasExistingData = addr.street || addr.address || addr.city || addr.contactName || addr.email;
      if (hasExistingData) {
        // Existing address — load it
        setFormData({
          contactName: addr.contactName || "",
          email: addr.email || "",
          street: addr.street || addr.address || "",
          city: addr.city || "",
          state: addr.state || "",
          zipCode: addr.zipCode || "",
          country: normalizeCountryCode(addr.country || "US"),
          phone: addr.phone || "",
        });
      } else if (relevantAddresses.length > 0) {
        // No address yet — auto-fill from default company address
        const defaultAddr = relevantAddresses.find((a) => a.isDefault) || relevantAddresses[0];
        fillFromCompanyAddress(defaultAddr);
      } else {
        // No company addresses available — start blank with contact info
        const contactFullName = primaryContact
          ? [primaryContact.firstName, primaryContact.lastName].filter(Boolean).join(" ")
          : "";
        setFormData({
          contactName: contactFullName,
          email: primaryContact?.email || "",
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "US",
          phone: primaryContact?.phone || "",
        });
      }
      setSameAsBilling(false);
    }
  }, [editing]);

  const handleFieldChange = (f: string, value: string) => {
    setFormData((prev) => ({ ...prev, [f]: value }));
  };

  const handleSave = () => {
    const hasData = formData.street || formData.city || formData.contactName || formData.email || formData.phone;
    if (hasData) {
      onSave({
        [field]: JSON.stringify({
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          phone: formData.phone,
          contactName: formData.contactName,
          email: formData.email,
        }),
      });
    } else {
      onSave({ [field]: null });
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const displayStreet = addr.street || addr.address || "";
  const displayLine2 = [addr.city, addr.state, addr.zipCode].filter(Boolean).join(", ");
  const hasAddress = displayStreet || displayLine2;

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {icon || <MapPin className="w-4 h-4" />}
            {title}
          </CardTitle>
          {!isLocked && !editing && (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setEditing(true)}>
              <Pencil className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-3">
            {/* Quick-fill options */}
            <div className="flex flex-wrap gap-2">
              {field === "shippingAddress" && billingAddressJson && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={sameAsBilling}
                    onCheckedChange={(checked) => {
                      const isChecked = !!checked;
                      setSameAsBilling(isChecked);
                      if (isChecked) {
                        const billingAddr = parseAddress(billingAddressJson);
                        setFormData({
                          contactName: billingAddr.contactName || "",
                          email: billingAddr.email || "",
                          street: billingAddr.street || billingAddr.address || "",
                          city: billingAddr.city || "",
                          state: billingAddr.state || "",
                          zipCode: billingAddr.zipCode || "",
                          country: normalizeCountryCode(billingAddr.country || "US"),
                          phone: billingAddr.phone || "",
                        });
                      }
                    }}
                  />
                  <span className="text-xs text-muted-foreground">Same as Billing Address</span>
                </label>
              )}
              {relevantAddresses.length > 0 && (
                <Select
                  onValueChange={(addressId) => {
                    const selected = relevantAddresses.find((a) => a.id === addressId);
                    if (selected) fillFromCompanyAddress(selected);
                  }}
                >
                  <SelectTrigger className="h-7 text-xs w-auto gap-1.5 px-2">
                    <Building className="w-3 h-3" />
                    <SelectValue placeholder="Fill from company address" />
                  </SelectTrigger>
                  <SelectContent>
                    {relevantAddresses.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.addressName || "Unnamed"} — {[a.street, a.city, a.state].filter(Boolean).join(", ").slice(0, 40)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Contact Name</Label>
                <Input value={formData.contactName} onChange={(e) => handleFieldChange("contactName", e.target.value)} placeholder="Attn: Name" className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input value={formData.email} onChange={(e) => handleFieldChange("email", e.target.value)} placeholder="email@example.com" className="h-8 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Street</Label>
              <AddressAutocomplete
                value={formData.street}
                onChange={(val) => handleFieldChange("street", val)}
                onAddressSelect={(a) => {
                  handleFieldChange("city", a.city);
                  handleFieldChange("state", a.state);
                  handleFieldChange("zipCode", a.zipCode);
                  handleFieldChange("country", normalizeCountryCode(a.country));
                }}
                placeholder="123 Main St"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">City</Label>
                <Input value={formData.city} onChange={(e) => handleFieldChange("city", e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">State</Label>
                <Input value={formData.state} onChange={(e) => handleFieldChange("state", e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">ZIP</Label>
                <Input value={formData.zipCode} onChange={(e) => handleFieldChange("zipCode", e.target.value)} className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Country</Label>
                <Select value={formData.country} onValueChange={(v) => handleFieldChange("country", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="MX">Mexico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input value={formData.phone} onChange={(e) => handleFieldChange("phone", e.target.value)} placeholder="(555) 123-4567" className="h-8 text-sm" />
              </div>
            </div>
            <div className="flex gap-1.5 justify-end pt-1">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCancel}>
                <X className="w-3 h-3 mr-1" />Cancel
              </Button>
              <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={isPending}>
                {isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                Save
              </Button>
            </div>
          </div>
        ) : hasAddress ? (
          <div className="text-sm">
            {displayStreet && <p>{displayStreet}</p>}
            {displayLine2 && <p>{displayLine2}</p>}
            {addr.contactName && <p className="text-gray-500 mt-1">Attn: {addr.contactName}</p>}
            {addr.email && <p className="text-gray-500">{addr.email}</p>}
            {addr.phone && <p className="text-gray-500">{addr.phone}</p>}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No address set
            {!isLocked && (
              <Button variant="link" size="sm" className="text-xs h-auto p-0 ml-2" onClick={() => setEditing(true)}>
                Add
              </Button>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
