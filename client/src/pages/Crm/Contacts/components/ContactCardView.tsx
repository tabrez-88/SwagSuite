import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/UserAvatar";
import type { Contact } from "@/services/contacts";
import { Building2, Edit, Eye, Mail, Phone, Star, Target, Trash2, Truck } from "lucide-react";

function getAssociationBadge(contact: Contact) {
  if (contact.companyId) {
    return (
      <Badge variant="outline" className="text-xs gap-1">
        <Building2 className="h-3 w-3" />
        {contact.companyName || "Company"}
      </Badge>
    );
  }
  if (contact.supplierId) {
    return (
      <Badge variant="secondary" className="text-xs gap-1">
        <Truck className="h-3 w-3" />
        {contact.supplierName || "Vendor"}
      </Badge>
    );
  }
  return null;
}

interface ContactCardViewProps {
  contacts: Contact[];
  onView: (id: string) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}

export function ContactCardView({ contacts, onView, onEdit, onDelete }: ContactCardViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {contacts.map((contact: Contact) => (
        <Card key={contact.id} className="hover:shadow-lg transition-shadow flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <UserAvatar name={`${contact.firstName} ${contact.lastName}`} size="md" />
                <div>
                  <CardTitle className="text-lg text-swag-navy">
                    {contact.firstName} {contact.lastName}
                  </CardTitle>
                  {contact.title && (
                    <p className="text-xs text-muted-foreground">{contact.title}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {contact.isPrimary && (
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs gap-1">
                    <Star className="h-3 w-3" />
                    Primary
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {getAssociationBadge(contact)}
              {contact.leadSource && (
                <Badge variant="outline" className="text-xs gap-1 bg-blue-50 text-blue-700 border-blue-200">
                  <Target className="h-3 w-3" />
                  {contact.leadSource}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              {contact.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{contact.phone}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => onView(contact.id)}
                className="bg-swag-primary hover:bg-swag-primary/90"
              >
                <Eye className="mr-1" size={12} />
                View
              </Button>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => onEdit(contact)}>
                  <Edit className="mr-1" size={12} />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(contact)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
