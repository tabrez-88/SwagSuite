import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Building,
  Calendar,
  Check,
  Clock,
  DollarSign,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  TrendingUp,
  UserX,
  Users,
} from "lucide-react";
import SendEmailDialog from "@/components/modals/SendEmailDialog";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { useOverviewTab } from "./hooks";
import type { OverviewTabProps } from "./types";

export default function OverviewTab({
  company,
  companyId,
  onTabChange,
  onCreateProject,
}: OverviewTabProps) {
  const {
    companyContacts,
    teamMembers,
    excitingNewsPosts,
    previewContacts,
    previewAddresses,
    previewActivities,
    taxCodeName,
    termsLabel,
    spendingReport,
    spendingLoading,
    openPopover,
    setOpenPopover,
    isEmailDialogOpen,
    setIsEmailDialogOpen,
    spendFrom,
    setSpendFrom,
    spendTo,
    setSpendTo,
    reassignMutation,
    handleSendEmail,
    applySpendPreset,
    formatCurrency,
    getSocialMediaIcon,
    getPlatformColor,
  } = useOverviewTab(companyId, company);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building className="h-4 w-4" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
                {/* Account Number */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Account Number</p>
                  <p className="text-sm font-medium">
                    {company.accountNumber || (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </p>
                </div>

                {/* Client Rep */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Client Rep</p>
                  <Popover
                    open={openPopover === "clientRep"}
                    onOpenChange={(open) => setOpenPopover(open ? "clientRep" : null)}
                  >
                    <div className="flex items-center gap-2">
                      {company.assignedUser ? (
                        <>
                          <UserAvatar size="xs" user={company.assignedUser} />
                          <span className="text-sm font-medium">
                            {company.assignedUser.firstName} {company.assignedUser.lastName}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Unassigned</span>
                      )}
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                      </PopoverTrigger>
                    </div>
                    <PopoverContent className="p-0 w-60" align="start">
                      <Command>
                        <CommandInput placeholder="Search team..." />
                        <CommandList>
                          <CommandEmpty>No team members found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              onSelect={() => reassignMutation.mutate({ userId: null })}
                              className="flex items-center gap-2"
                            >
                              <UserX className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Unassign</span>
                            </CommandItem>
                            {teamMembers.map((member: any) => {
                              const isSelected = company.assignedUser?.id === member.id;
                              return (
                                <CommandItem
                                  key={member.id}
                                  value={`${member.firstName} ${member.lastName} ${member.email}`}
                                  onSelect={() => reassignMutation.mutate({ userId: member.id })}
                                  className="flex items-center gap-2"
                                >
                                  <UserAvatar size="xs" user={member} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {member.firstName} {member.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {member.email}
                                    </p>
                                  </div>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-green-600 shrink-0" />
                                  )}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Default Terms */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Default Terms</p>
                  <p className="text-sm font-medium">
                    {termsLabel || (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </p>
                </div>

                {/* Tax */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tax</p>
                  <div className="flex items-center gap-2">
                    {company.taxExempt && (
                      <Badge
                        variant="outline"
                        className="border-amber-500 text-amber-700 bg-amber-50 text-xs"
                      >
                        Exempt
                      </Badge>
                    )}
                    <p className="text-sm font-medium">
                      {taxCodeName || (
                        <span className="text-muted-foreground italic">
                          {company.taxExempt ? "" : "Default"}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Industry */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Industry</p>
                  <p className="text-sm font-medium">
                    {company.industry || (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </p>
                </div>

                {/* Website */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Website</p>
                  {company.website ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-swag-orange hover:underline flex items-center gap-1"
                    >
                      {company.website.replace(/^https?:\/\//, "")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Not set</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              {company.notes && (
                <div className="pt-4 mt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{company.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(company.ytdSpend)}</p>
                    <p className="text-xs text-muted-foreground">YTD Spending</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {company.customerScore !== undefined && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">{company.customerScore}</p>
                      <p className="text-xs text-muted-foreground">Customer Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">
                      {company.createdAt
                        ? format(new Date(company.createdAt), "MMM d, yyyy")
                        : "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground">Customer Since</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Spending Report */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                Spending Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Controls */}
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <Label className="text-xs">From</Label>
                  <Input
                    type="date"
                    value={spendFrom}
                    onChange={(e) => setSpendFrom(e.target.value)}
                    className="h-8 w-40 mt-1"
                    data-testid="spend-from"
                  />
                </div>
                <div>
                  <Label className="text-xs">To</Label>
                  <Input
                    type="date"
                    value={spendTo}
                    onChange={(e) => setSpendTo(e.target.value)}
                    className="h-8 w-40 mt-1"
                    data-testid="spend-to"
                  />
                </div>
                <div className="flex flex-wrap gap-1 ml-auto">
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => applySpendPreset("ytd")}>YTD</Button>
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => applySpendPreset("qtd")}>QTD</Button>
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => applySpendPreset("last30")}>Last 30d</Button>
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => applySpendPreset("last90")}>Last 90d</Button>
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => applySpendPreset("lastYear")}>Last Year</Button>
                </div>
              </div>

              {/* Summary */}
              {spendingLoading ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading spending data...
                </div>
              ) : spendingReport ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="border rounded-lg p-3 bg-green-50 border-green-200">
                      <p className="text-xs text-green-800 font-medium">Total Spend</p>
                      <p className="text-2xl font-bold text-green-900">
                        {formatCurrency(spendingReport.totalSpend.toFixed(2))}
                      </p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="text-xs text-muted-foreground font-medium">Orders</p>
                      <p className="text-2xl font-bold">{spendingReport.orderCount}</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="text-xs text-muted-foreground font-medium">Avg Order</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(
                          spendingReport.orderCount > 0
                            ? (spendingReport.totalSpend / spendingReport.orderCount).toFixed(2)
                            : "0"
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Monthly breakdown */}
                  {spendingReport.monthly.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Monthly breakdown</p>
                      <div className="space-y-1">
                        {spendingReport.monthly.map((m) => {
                          const pct =
                            spendingReport.totalSpend > 0
                              ? (m.total / spendingReport.totalSpend) * 100
                              : 0;
                          return (
                            <div key={m.month} className="flex items-center gap-3 text-xs">
                              <span className="w-16 shrink-0 font-mono text-muted-foreground">{m.month}</span>
                              <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                                <div
                                  className="h-full bg-swag-orange"
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <span className="w-24 text-right font-medium">
                                {formatCurrency(m.total.toFixed(2))}
                              </span>
                              <span className="w-10 text-right text-muted-foreground">
                                {m.count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {spendingReport.orderCount === 0 && (
                    <p className="text-sm text-muted-foreground italic text-center py-4">
                      No committed orders in this date range.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  No spending data available.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Custom Fields */}
          {company.customFields && Object.keys(company.customFields).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Custom Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(company.customFields).map(([key, value]) => (
                    <div key={key} className="border rounded-md p-2">
                      <p className="text-xs font-medium text-muted-foreground">{key}</p>
                      <p className="text-sm">{value as string}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {/* Contacts Preview Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  Contacts
                </CardTitle>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-swag-orange"
                  onClick={() => onTabChange("contacts")}
                >
                  View All
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {previewContacts.length > 0 ? (
                <div className="space-y-3">
                  {previewContacts.map((contact: any) => (
                    <div key={contact.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-gray-100">
                          {contact.firstName?.[0]}
                          {contact.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate flex items-center gap-1">
                          {contact.firstName} {contact.lastName}
                          {contact.isPrimary && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              Primary
                            </Badge>
                          )}
                        </span>
                        {contact.email && (
                          <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {companyContacts.length > 4 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      +{companyContacts.length - 4} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  No contacts yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Addresses Preview Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  Addresses
                </CardTitle>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-swag-orange"
                  onClick={() => onTabChange("addresses")}
                >
                  View All
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {previewAddresses.length > 0 ? (
                <div className="space-y-3">
                  {previewAddresses.map((addr: any) => (
                    <div key={addr.id} className="text-sm">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium">{addr.addressName || "Address"}</p>
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {addr.addressType === "both"
                            ? "Bill & Ship"
                            : addr.addressType === "billing"
                              ? "Billing"
                              : "Shipping"}
                        </Badge>
                        {addr.isDefault && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {[addr.street, addr.city, addr.state, addr.zipCode]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  ))}
                  {(company.addresses || []).length > 3 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      +{(company.addresses || []).length - 3} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  No addresses yet
                </p>
              )}
            </CardContent>
          </Card>


        </div>

        {/* Right Column */}
        <div className="space-y-6">


          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleSendEmail}
                disabled={companyContacts.filter((c: any) => c.email).length === 0}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={onCreateProject}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Create New Project
              </Button>
            </CardContent>
          </Card>
          {/* Activity Preview Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  Recent Activity
                </CardTitle>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-swag-orange"
                  onClick={() => onTabChange("activity")}
                >
                  View All
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {previewActivities.length > 0 ? (
                <div className="space-y-3">
                  {previewActivities.map((activity: any) => {
                    const dotColor =
                      activity.activityType === "created" || activity.activityType === "artwork_approved"
                        ? "bg-green-500"
                        : activity.activityType === "updated" || activity.activityType === "comment"
                          ? "bg-blue-500"
                          : activity.activityType === "status_change"
                            ? "bg-purple-500"
                            : activity.activityType === "deleted" || activity.activityType === "artwork_rejected"
                              ? "bg-red-500"
                              : activity.activityType === "system_action"
                                ? "bg-amber-500"
                                : "bg-gray-400";
                    return (
                      <div key={activity.id} className="flex items-start gap-2">
                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${dotColor}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate">{activity.content}</p>
                          {activity.type === "project" && activity.projectName && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {activity.projectName}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground">
                            {activity.userName && <>{activity.userName} · </>}
                            {activity.createdAt
                              ? format(new Date(activity.createdAt), "MMM d, yyyy h:mm a")
                              : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  No activity yet
                </p>
              )}
            </CardContent>
          </Card>
          {/* Social Media Links */}
          {company.socialMediaLinks &&
            Object.values(company.socialMediaLinks).some((link) => link) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Social Media</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(company.socialMediaLinks as Record<string, string>).map(
                    ([platform, url]) =>
                      url && (
                        <div key={platform} className="flex items-center gap-3">
                          <div className={`${getPlatformColor(platform)}`}>
                            {getSocialMediaIcon(platform)}
                          </div>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-swag-orange hover:underline capitalize flex-1"
                          >
                            {platform}
                          </a>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                      )
                  )}
                </CardContent>
              </Card>
            )}

          {/* Exciting News Alert */}
          {excitingNewsPosts.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  Exciting News Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-yellow-700 mb-2">
                  {excitingNewsPosts.length} exciting news update
                  {excitingNewsPosts.length > 1 ? "s" : ""} recently.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onTabChange("social")}
                  className="w-full text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Send Email Dialog */}
      <SendEmailDialog
        open={isEmailDialogOpen}
        onOpenChange={setIsEmailDialogOpen}
        contacts={companyContacts}
        companyName={company.name}
        defaultSubject={`Follow up with ${company.name}`}
      />
    </>
  );
}
