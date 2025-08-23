import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  DollarSign, 
  Package, 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Clock,
  FileText,
  Truck,
  CheckCircle,
  MessageSquare,
  Send,
  AtSign,
  ExternalLink,
  Tag
} from "lucide-react";
import type { Order } from "@shared/schema";
import { useState, useRef } from "react";
import { useLocation } from "wouter";

interface OrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  companyName: string;
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const statusColorMap = {
  quote: "bg-blue-100 text-blue-800",
  pending_approval: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  in_production: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusDisplayMap = {
  quote: "Quote",
  pending_approval: "Pending Approval",
  approved: "Approved",
  in_production: "In Production",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function OrderDetailsModal({ open, onOpenChange, order, companyName }: OrderDetailsModalProps) {
  const [, setLocation] = useLocation();
  const [internalNote, setInternalNote] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [vendorEmailTo, setVendorEmailTo] = useState("");
  const [vendorEmailSubject, setVendorEmailSubject] = useState("");
  const [vendorEmailBody, setVendorEmailBody] = useState("");
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mock team members for @ mentions
  const teamMembers: TeamMember[] = [
    { id: "user1", firstName: "Sarah", lastName: "Johnson", email: "sarah@swag.com" },
    { id: "user2", firstName: "Mike", lastName: "Chen", email: "mike@swag.com" },
    { id: "user3", firstName: "Alex", lastName: "Rodriguez", email: "alex@swag.com" },
    { id: "user4", firstName: "Emily", lastName: "Davis", email: "emily@swag.com" },
  ];

  if (!order) return null;

  const statusClass = statusColorMap[order.status as keyof typeof statusColorMap] || "bg-gray-100 text-gray-800";
  const statusLabel = statusDisplayMap[order.status as keyof typeof statusDisplayMap] || order.status;

  const handleViewProject = () => {
    setLocation(`/project/${order.id}`);
    onOpenChange(false);
  };

  const handleMentionInput = (value: string) => {
    setInternalNote(value);
    const atIndex = value.lastIndexOf('@');
    if (atIndex !== -1 && atIndex === value.length - 1) {
      setShowMentionSuggestions(true);
      setMentionQuery("");
    } else if (atIndex !== -1) {
      const query = value.slice(atIndex + 1);
      if (query.includes(' ')) {
        setShowMentionSuggestions(false);
      } else {
        setMentionQuery(query);
        setShowMentionSuggestions(true);
      }
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const handleMentionSelect = (member: TeamMember) => {
    const atIndex = internalNote.lastIndexOf('@');
    const beforeMention = internalNote.slice(0, atIndex);
    const afterMention = internalNote.slice(atIndex + mentionQuery.length + 1);
    setInternalNote(`${beforeMention}@${member.firstName} ${member.lastName}${afterMention}`);
    setShowMentionSuggestions(false);
    textareaRef.current?.focus();
  };

  const filteredTeamMembers = teamMembers.filter((member: TeamMember) =>
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleSendInternalNote = () => {
    // In a real app, this would send to your backend
    console.log("Sending internal note:", internalNote);
    setInternalNote("");
  };

  const handleSendEmail = () => {
    // In a real app, this would integrate with your email service
    console.log("Sending email:", { to: emailTo, subject: emailSubject, body: emailBody });
    setEmailTo("");
    setEmailSubject("");
    setEmailBody("");
  };

  const handleSendVendorEmail = () => {
    // In a real app, this would integrate with your email service
    console.log("Sending vendor email:", { to: vendorEmailTo, subject: vendorEmailSubject, body: vendorEmailBody });
    setVendorEmailTo("");
    setVendorEmailSubject("");
    setVendorEmailBody("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            Order #{order.orderNumber}
            <Badge className={statusClass}>
              {statusLabel}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewProject}
              className="ml-auto"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Full Project
            </Button>
          </DialogTitle>
          <DialogDescription>
            Complete order details, internal communications, and client contact
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Order Details</TabsTrigger>
            <TabsTrigger value="communication">Internal Notes</TabsTrigger>
            <TabsTrigger value="email">Client Communication</TabsTrigger>
            <TabsTrigger value="vendor">Vendor Communication</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Order Information */}
          <div className="space-y-6">
            {/* Company & Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <UserAvatar name={companyName} size="sm" />
                  <div>
                    <p className="font-semibold">{companyName}</p>
                    <p className="text-sm text-gray-600">Primary Client</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Primary Contact</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">contact@company.com</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">(555) 123-4567</span>
                </div>
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Order Type</p>
                    <Badge variant="outline" className="mt-1">
                      {order.orderType?.replace('_', ' ').toUpperCase() || 'QUOTE'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Priority</p>
                    <Badge variant="secondary" className="mt-1">
                      NORMAL
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">Total: </span>
                    <span className="text-lg font-bold text-green-600">
                      ${Number(order.total || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">Deposit: </span>
                    <span className="text-sm">
                      ${(Number(order.total || 0) * 0.5).toLocaleString()}
                    </span>
                  </div>

                  {order.inHandsDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">In-Hands Date: </span>
                      <span className="text-sm">
                        {new Date(order.inHandsDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {order.eventDate && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Event Date: </span>
                      <span className="text-sm">
                        {new Date(order.eventDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Additional Information */}
          <div className="space-y-6">
            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Shipping Address:</p>
                    <p className="text-gray-600">123 Business Ave<br />Suite 100<br />City, ST 12345</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Shipping Method</p>
                  <p className="text-sm">UPS Ground</p>
                </div>
              </CardContent>
            </Card>

            {/* Notes & Special Instructions */}
            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Notes & Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{order.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Order Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="text-sm">
                    <p className="font-medium">Order Created</p>
                    <p className="text-gray-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                
                {order.updatedAt && order.updatedAt !== order.createdAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="text-sm">
                      <p className="font-medium">Last Updated</p>
                      <p className="text-gray-500">
                        {new Date(order.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="default" className="flex-1" onClick={handleViewProject}>
                <ExternalLink className="w-4 h-4 mr-2" />
                View Full Project
              </Button>
              <Button variant="outline" className="flex-1">
                Edit Order
              </Button>
            </div>
          </div>
        </div>
          </TabsContent>

          <TabsContent value="communication" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Internal Team Notes
                  <Tag className="w-4 h-4 ml-auto" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Add internal note... Use @ to mention team members"
                    value={internalNote}
                    onChange={(e) => handleMentionInput(e.target.value)}
                    className="min-h-[120px]"
                    data-testid="textarea-internal-note"
                  />
                  
                  {/* Mention Suggestions */}
                  {showMentionSuggestions && filteredTeamMembers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                      {filteredTeamMembers.slice(0, 5).map((member: TeamMember) => (
                        <button
                          key={member.id}
                          onClick={() => handleMentionSelect(member)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                          data-testid={`mention-${member.id}`}
                        >
                          <UserAvatar name={`${member.firstName} ${member.lastName}`} size="sm" />
                          <div>
                            <p className="text-sm font-medium">{member.firstName} {member.lastName}</p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSendInternalNote}
                    disabled={!internalNote.trim()}
                    className="flex-1"
                    data-testid="button-send-internal-note"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Internal Note
                  </Button>
                </div>

                {/* Recent Internal Notes */}
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Recent Internal Notes</h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <UserAvatar name="Sarah Johnson" size="sm" />
                        <span className="text-sm font-medium">Sarah Johnson</span>
                        <span className="text-xs text-gray-500">2 hours ago</span>
                      </div>
                      <p className="text-sm text-gray-700">Customer confirmed artwork approval. Ready to move to production. @Mike Chen please coordinate with vendor.</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <UserAvatar name="Mike Chen" size="sm" />
                        <span className="text-sm font-medium">Mike Chen</span>
                        <span className="text-xs text-gray-500">1 day ago</span>
                      </div>
                      <p className="text-sm text-gray-700">Vendor confirmed 5-day production timeline. Will ship on Friday.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Client Communication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">To:</label>
                    <Input
                      placeholder="client@company.com"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      data-testid="input-email-to"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subject:</label>
                    <Input
                      placeholder={`Re: Order #${order.orderNumber}`}
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      data-testid="input-email-subject"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Message:</label>
                  <Textarea
                    placeholder="Compose your message to the client..."
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="min-h-[150px] mt-1"
                    data-testid="textarea-email-body"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSendEmail}
                    disabled={!emailTo || !emailSubject || !emailBody.trim()}
                    className="flex-1"
                    data-testid="button-send-email"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                  <Button variant="outline">
                    Save Draft
                  </Button>
                </div>

                {/* Email Templates */}
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Quick Templates</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEmailSubject(`Order Update - #${order.orderNumber}`);
                        setEmailBody(`Hi there,\n\nI wanted to provide you with an update on your order #${order.orderNumber}.\n\nBest regards,\nYour SwagSuite Team`);
                      }}
                    >
                      Order Update
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEmailSubject(`Artwork Approval Required - #${order.orderNumber}`);
                        setEmailBody(`Hi there,\n\nWe need your approval on the artwork for order #${order.orderNumber} before we can proceed to production.\n\nPlease review and let us know if you have any changes.\n\nBest regards,\nYour SwagSuite Team`);
                      }}
                    >
                      Artwork Approval
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEmailSubject(`Order Shipped - #${order.orderNumber}`);
                        setEmailBody(`Great news!\n\nYour order #${order.orderNumber} has been shipped and is on its way to you.\n\nTracking information will be provided separately.\n\nBest regards,\nYour SwagSuite Team`);
                      }}
                    >
                      Order Shipped
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEmailSubject(`Invoice - #${order.orderNumber}`);
                        setEmailBody(`Hi there,\n\nPlease find attached the invoice for order #${order.orderNumber}.\n\nPayment is due within 30 days.\n\nBest regards,\nYour SwagSuite Team`);
                      }}
                    >
                      Invoice
                    </Button>
                  </div>
                </div>

                {/* Recent Emails */}
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Recent Communications</h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium">Sent: Artwork Approval Request</span>
                        <span className="text-xs text-gray-500">Yesterday, 3:24 PM</span>
                      </div>
                      <p className="text-sm text-gray-700">Requested client approval for logo placement and colors.</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium">Received: Approval Confirmed</span>
                        <span className="text-xs text-gray-500">Today, 9:15 AM</span>
                      </div>
                      <p className="text-sm text-gray-700">Client approved artwork with minor color adjustment request.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendor" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Vendor Communication */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Vendor Communication
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-sm font-medium">To:</label>
                      <Input
                        placeholder="vendor@supplier.com"
                        value={vendorEmailTo}
                        onChange={(e) => setVendorEmailTo(e.target.value)}
                        data-testid="input-vendor-email-to"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Subject:</label>
                      <Input
                        placeholder={`Production Update - Order #${order.orderNumber}`}
                        value={vendorEmailSubject}
                        onChange={(e) => setVendorEmailSubject(e.target.value)}
                        data-testid="input-vendor-email-subject"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Message:</label>
                    <Textarea
                      placeholder="Compose your message to the vendor..."
                      value={vendorEmailBody}
                      onChange={(e) => setVendorEmailBody(e.target.value)}
                      className="min-h-[150px] mt-1"
                      data-testid="textarea-vendor-email-body"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSendVendorEmail}
                      disabled={!vendorEmailTo || !vendorEmailSubject || !vendorEmailBody.trim()}
                      className="flex-1"
                      data-testid="button-send-vendor-email"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send to Vendor
                    </Button>
                    <Button variant="outline">
                      Save Draft
                    </Button>
                  </div>

                  {/* Vendor Email Templates */}
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Vendor Templates</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setVendorEmailSubject(`Production Start Request - Order #${order.orderNumber}`);
                          setVendorEmailBody(`Hello,\n\nWe are ready to begin production for order #${order.orderNumber}.\n\nOrder Details:\n- Quantity: [QUANTITY]\n- Product: [PRODUCT]\n- In-Hands Date: ${order.inHandsDate ? new Date(order.inHandsDate).toLocaleDateString() : '[DATE]'}\n\nPlease confirm production timeline and any requirements.\n\nBest regards,\nSwagSuite Team`);
                        }}
                      >
                        Production Start Request
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setVendorEmailSubject(`Production Status Check - Order #${order.orderNumber}`);
                          setVendorEmailBody(`Hello,\n\nCould you please provide a status update on order #${order.orderNumber}?\n\nWe need to confirm the production timeline to meet our delivery commitments.\n\nThank you for your attention to this matter.\n\nBest regards,\nSwagSuite Team`);
                        }}
                      >
                        Status Check
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setVendorEmailSubject(`Artwork Files - Order #${order.orderNumber}`);
                          setVendorEmailBody(`Hello,\n\nPlease find attached the final artwork files for order #${order.orderNumber}.\n\nArtwork has been approved by the client and is ready for production.\n\nPlease confirm receipt and estimated production start date.\n\nBest regards,\nSwagSuite Team`);
                        }}
                      >
                        Send Artwork
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setVendorEmailSubject(`Rush Order Request - Order #${order.orderNumber}`);
                          setVendorEmailBody(`Hello,\n\nWe have a rush request for order #${order.orderNumber}.\n\nRequired in-hands date: ${order.inHandsDate ? new Date(order.inHandsDate).toLocaleDateString() : '[DATE]'}\n\nPlease let us know if this timeline is possible and any additional costs.\n\nThank you for your flexibility.\n\nBest regards,\nSwagSuite Team`);
                        }}
                      >
                        Rush Request
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vendor Information & Communication History */}
              <div className="space-y-6">
                {/* Current Vendor Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Assigned Vendor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <UserAvatar name="Promotional Products Co." size="sm" />
                      <div>
                        <p className="font-semibold">Promotional Products Co.</p>
                        <p className="text-sm text-gray-600">Primary Vendor</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Contact: John Smith</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">production@promotionalco.com</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">(555) 987-6543</span>
                      </div>
                    </div>

                    <Separator />
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Vendor Performance</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">On-Time Delivery</p>
                          <p className="font-medium text-green-600">94%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Quality Rating</p>
                          <p className="font-medium text-green-600">4.8/5</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Vendor Communications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Recent Vendor Communications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium">Sent: Production Timeline Request</span>
                          <span className="text-xs text-gray-500">2 hours ago</span>
                        </div>
                        <p className="text-sm text-gray-700">Requested production schedule for current order batch including this order.</p>
                      </div>
                      
                      <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium">Received: Timeline Confirmed</span>
                          <span className="text-xs text-gray-500">Yesterday, 4:30 PM</span>
                        </div>
                        <p className="text-sm text-gray-700">Vendor confirmed 5-day production timeline. Ready to start upon artwork approval.</p>
                      </div>
                      
                      <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium">Sent: Artwork Package</span>
                          <span className="text-xs text-gray-500">2 days ago</span>
                        </div>
                        <p className="text-sm text-gray-700">Sent final artwork files and production specifications.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}