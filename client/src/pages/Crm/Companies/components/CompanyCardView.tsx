import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/shared/UserAvatar";
import type { Company } from "@/services/companies";
import {
  Building,
  DollarSign,
  Edit,
  Eye,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  MoreHorizontal,
  Trash2,
  Twitter,
} from "lucide-react";

const ENGAGEMENT_COLORS = {
  high: "bg-green-100 text-green-800 hover:bg-green-200",
  medium: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  low: "bg-red-100 text-red-800 hover:bg-red-200",
  undefined: "bg-gray-100 text-gray-800 hover:bg-gray-200",
};

function getSocialMediaIcon(platform: string) {
  switch (platform) {
    case "linkedin": return <Linkedin className="h-4 w-4" />;
    case "twitter": return <Twitter className="h-4 w-4" />;
    case "facebook": return <Facebook className="h-4 w-4" />;
    case "instagram": return <Instagram className="h-4 w-4" />;
    default: return <Globe className="h-4 w-4" />;
  }
}

interface CompanyCardViewProps {
  companies: Company[];
  formatCurrency: (value: string | undefined) => string;
  onNavigate: (id: string) => void;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
}

export function CompanyCardView({ companies, formatCurrency, onNavigate, onEdit, onDelete }: CompanyCardViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {companies.map((company: Company) => (
        <Card
          key={company.id}
          onClick={() => onNavigate(company.id)}
          className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col justify-between"
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <UserAvatar name={company.name} size="md" />
                <div>
                  <CardTitle className="text-lg text-swag-navy line-clamp-1">
                    {company.name}
                  </CardTitle>
                  {company.industry && (
                    <p className="text-sm text-muted-foreground">{company.industry}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {company.engagementLevel && (
                  <Badge
                    className={
                      ENGAGEMENT_COLORS[company.engagementLevel as keyof typeof ENGAGEMENT_COLORS] || ENGAGEMENT_COLORS.undefined
                    }
                  >
                    {company.engagementLevel.charAt(0).toUpperCase() + company.engagementLevel.slice(1)}
                  </Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onNavigate(company.id); }}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(company); }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(company); }} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {company.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {company.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
              {company.industry && (
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground text-xs">{company.industry}</span>
                </div>
              )}
            </div>

            {/* Social Media Links */}
            {company.socialMediaLinks &&
              Object.values(company.socialMediaLinks).some((link) => link) && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <span className="text-xs text-muted-foreground">Social:</span>
                  <div className="flex gap-1">
                    {Object.entries(company.socialMediaLinks).map(
                      ([platform, url]) =>
                        url && (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-swag-orange transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {getSocialMediaIcon(platform)}
                          </a>
                        )
                    )}
                  </div>
                </div>
              )}

            {/* Company Stats */}
            <div className="flex items-center justify-between text-sm pt-2 border-t">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">YTD:</span>
                <span className="font-medium">{formatCurrency(company.ytdSpend)}</span>
              </div>
              {company.customerScore && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Score:</span>
                  <span className="font-medium">{company.customerScore}</span>
                </div>
              )}
            </div>

            {company.notes && (
              <div className="text-sm text-muted-foreground line-clamp-2 pt-2 border-t">
                {company.notes}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
