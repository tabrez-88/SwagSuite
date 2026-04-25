import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/UserAvatar";
import type { Lead } from "@/services/leads";
import { Calendar, DollarSign, Edit, Mail, Phone, Trash2 } from "lucide-react";
import { STATUS_COLORS } from "../types";

interface LeadCardViewProps {
  leads: Lead[];
  getLeadScore: (lead: Lead) => number;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}

export function LeadCardView({ leads, getLeadScore, onEdit, onDelete }: LeadCardViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {leads.map((lead: Lead) => {
        const leadScore = getLeadScore(lead);
        return (
          <Card key={lead.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <UserAvatar name={`${lead.firstName} ${lead.lastName}`} size="md" />
                  <div>
                    <CardTitle className="text-lg text-swag-navy">
                      {lead.firstName} {lead.lastName}
                    </CardTitle>
                    {lead.company && (
                      <p className="text-sm text-muted-foreground">{lead.company}</p>
                    )}
                    {lead.title && (
                      <p className="text-xs text-muted-foreground">{lead.title}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={STATUS_COLORS[lead.status as keyof typeof STATUS_COLORS]}>
                    {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {lead.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{lead.email}</span>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{lead.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{lead.source}</Badge>
                </div>
              </div>

              {lead.estimatedValue && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">
                    ${lead.estimatedValue.toLocaleString()}
                  </span>
                </div>
              )}

              {lead.nextFollowUpDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <span className="text-muted-foreground">
                    Follow-up: {new Date(lead.nextFollowUpDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(lead)}>
                  <Edit className="mr-1" size={12} />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(lead)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
