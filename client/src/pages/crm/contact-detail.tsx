import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Building2,
  MapPin,
  AlertCircle,
  Star,
  Truck,
  FileText,
  Briefcase,
} from "lucide-react";

interface Contact {
  id: string;
  companyId?: string;
  supplierId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  isPrimary?: boolean;
  billingAddress?: string;
  shippingAddress?: string;
  createdAt?: string;
  updatedAt?: string;
  companyName?: string;
  supplierName?: string;
}

function parseAddress(addressJson?: string): { street?: string; city?: string; state?: string; zipCode?: string; country?: string } | null {
  if (!addressJson) return null;
  try {
    return JSON.parse(addressJson);
  } catch {
    return null;
  }
}

function formatAddress(addr: { street?: string; city?: string; state?: string; zipCode?: string; country?: string } | null): string | null {
  if (!addr) return null;
  const parts = [addr.street, [addr.city, addr.state, addr.zipCode].filter(Boolean).join(", "), addr.country].filter(Boolean);
  return parts.length > 0 ? parts.join("\n") : null;
}

export default function ContactDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();

  const { data: contact, isLoading, error } = useQuery<Contact>({
    queryKey: ['/api/contacts', params.id],
    queryFn: async () => {
      const response = await fetch(`/api/contacts/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch contact");
      return response.json();
    },
    enabled: !!params.id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Contact Not Found</h3>
          <p className="text-sm text-red-700 mb-4">
            The contact you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => setLocation('/crm')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to CRM
          </Button>
        </div>
      </div>
    );
  }

  const billingAddr = parseAddress(contact.billingAddress);
  const shippingAddr = parseAddress(contact.shippingAddress);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/crm')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to CRM
          </Button>
          <div className="flex items-center gap-3">
            <UserAvatar name={`${contact.firstName} ${contact.lastName}`} size="lg" />
            <div>
              <h1 className="text-3xl font-bold text-swag-navy">
                {contact.firstName} {contact.lastName}
              </h1>
              <p className="text-muted-foreground">
                {contact.title || 'Contact Details'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {contact.isPrimary && (
            <Badge className="bg-yellow-100 text-yellow-800 gap-1">
              <Star className="h-3 w-3" />
              Primary Contact
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contact.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <a href={`mailto:${contact.email}`} className="text-sm text-blue-600 hover:underline">
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{contact.phone}</span>
                </div>
              )}
              {contact.title && (
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{contact.title}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Association */}
          {(contact.companyId || contact.supplierId) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {contact.companyId ? <Building2 className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                  {contact.companyId ? "Company" : "Vendor"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    {contact.companyId ? <Building2 className="w-5 h-5 text-gray-600" /> : <Truck className="w-5 h-5 text-gray-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-swag-navy">
                      {contact.companyName || contact.supplierName || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {contact.companyId ? "Company" : "Vendor"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Addresses */}
          {(billingAddr || shippingAddr) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Addresses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {billingAddr && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Billing Address</p>
                    <p className="text-sm whitespace-pre-line">{formatAddress(billingAddr)}</p>
                  </div>
                )}
                {billingAddr && shippingAddr && <Separator />}
                {shippingAddr && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Shipping Address</p>
                    <p className="text-sm whitespace-pre-line">{formatAddress(shippingAddr)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Order History</h3>
                <p className="text-sm text-gray-500">
                  Order history for this contact will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
