import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  Mail,
  UserCheck,
  UserX,
  MoreHorizontal,
  Trash2,
  Edit,
  Tag
} from "lucide-react";
import { NewsletterSubscriber, NewsletterList } from "@shared/schema";

interface SubscriberWithExtras extends NewsletterSubscriber {
  listNames?: string[];
}

export function SubscriberManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
  const [showAddSubscriber, setShowAddSubscriber] = useState(false);
  const [showCreateList, setShowCreateList] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Mock data for development
  const mockSubscribers: SubscriberWithExtras[] = [
    {
      id: "1",
      email: "john.doe@example.com",
      firstName: "John",
      lastName: "Doe",
      status: "active",
      source: "website",
      tags: ["vip", "customer"],
      customFields: { company: "ABC Corp", industry: "Tech" },
      subscriptionDate: new Date("2024-12-01"),
      unsubscribeDate: null,
      lastEmailSent: new Date("2025-01-01"),
      engagementScore: 85,
      createdAt: new Date("2024-12-01"),
      updatedAt: new Date("2025-01-01"),
      listNames: ["Main List", "VIP Customers"]
    },
    {
      id: "2",
      email: "jane.smith@example.com",
      firstName: "Jane",
      lastName: "Smith",
      status: "active",
      source: "import",
      tags: ["customer"],
      customFields: { company: "XYZ Inc", industry: "Manufacturing" },
      subscriptionDate: new Date("2024-11-15"),
      unsubscribeDate: null,
      lastEmailSent: new Date("2024-12-28"),
      engagementScore: 72,
      createdAt: new Date("2024-11-15"),
      updatedAt: new Date("2024-12-28"),
      listNames: ["Main List"]
    },
    {
      id: "3",
      email: "bob.wilson@example.com",
      firstName: "Bob",
      lastName: "Wilson",
      status: "unsubscribed",
      source: "form",
      tags: [],
      customFields: {},
      subscriptionDate: new Date("2024-10-20"),
      unsubscribeDate: new Date("2024-12-15"),
      lastEmailSent: new Date("2024-12-10"),
      engagementScore: 45,
      createdAt: new Date("2024-10-20"),
      updatedAt: new Date("2024-12-15"),
      listNames: ["Main List"]
    }
  ];

  const mockLists: NewsletterList[] = [
    {
      id: "1",
      name: "Main List",
      description: "Primary subscriber list for all marketing campaigns",
      subscriberCount: 15420,
      segmentRules: null,
      createdBy: "user-1",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2025-01-01")
    },
    {
      id: "2", 
      name: "VIP Customers",
      description: "High-value customers with special offers",
      subscriberCount: 1250,
      segmentRules: { minEngagementScore: 80, tags: ["vip"] },
      createdBy: "user-1",
      createdAt: new Date("2024-06-01"),
      updatedAt: new Date("2024-12-01")
    },
    {
      id: "3",
      name: "New Subscribers",
      description: "Recently joined subscribers for welcome series",
      subscriberCount: 340,
      segmentRules: { daysSubscribed: { max: 30 } },
      createdBy: "user-1",
      createdAt: new Date("2024-12-01"),
      updatedAt: new Date("2025-01-01")
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "unsubscribed": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "bounced": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredSubscribers = mockSubscribers.filter(subscriber => {
    const matchesSearch = !searchTerm || 
      subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${subscriber.firstName} ${subscriber.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || subscriber.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleSelectSubscriber = (subscriberId: string) => {
    setSelectedSubscribers(prev => 
      prev.includes(subscriberId) 
        ? prev.filter(id => id !== subscriberId)
        : [...prev, subscriberId]
    );
  };

  const handleSelectAll = () => {
    setSelectedSubscribers(
      selectedSubscribers.length === filteredSubscribers.length 
        ? [] 
        : filteredSubscribers.map(s => s.id)
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="subscribers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="subscribers" data-testid="tab-subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="lists" data-testid="tab-lists">Lists</TabsTrigger>
          <TabsTrigger value="segments" data-testid="tab-segments">Segments</TabsTrigger>
        </TabsList>

        <TabsContent value="subscribers" className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search subscribers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-subscribers"
                />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" data-testid="button-export-subscribers">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-import-subscribers">
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Subscribers</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="csv-file">CSV File</Label>
                      <Input type="file" accept=".csv" id="csv-file" data-testid="input-csv-file" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Upload a CSV file with columns: email, firstName, lastName, tags (comma-separated)
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                        Cancel
                      </Button>
                      <Button data-testid="button-upload-csv">Upload</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={showAddSubscriber} onOpenChange={setShowAddSubscriber}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-subscriber">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subscriber
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Subscriber</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first-name">First Name</Label>
                        <Input id="first-name" placeholder="John" data-testid="input-first-name" />
                      </div>
                      <div>
                        <Label htmlFor="last-name">Last Name</Label>
                        <Input id="last-name" placeholder="Doe" data-testid="input-last-name" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="john@example.com" 
                        data-testid="input-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input id="tags" placeholder="customer, vip" data-testid="input-tags" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddSubscriber(false)}>
                        Cancel
                      </Button>
                      <Button data-testid="button-save-subscriber">Add Subscriber</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedSubscribers.length > 0 && (
            <Card data-testid="card-bulk-actions">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedSubscribers.length} subscriber(s) selected
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" data-testid="button-bulk-tag">
                      <Tag className="w-4 h-4 mr-2" />
                      Add Tags
                    </Button>
                    <Button variant="outline" size="sm" data-testid="button-bulk-move">
                      <Users className="w-4 h-4 mr-2" />
                      Move to List
                    </Button>
                    <Button variant="outline" size="sm" data-testid="button-bulk-unsubscribe">
                      <UserX className="w-4 h-4 mr-2" />
                      Unsubscribe
                    </Button>
                    <Button variant="outline" size="sm" data-testid="button-bulk-delete">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subscribers Table */}
          <Card data-testid="card-subscribers-table">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4">
                        <Checkbox
                          checked={selectedSubscribers.length === filteredSubscribers.length}
                          onCheckedChange={handleSelectAll}
                          data-testid="checkbox-select-all"
                        />
                      </th>
                      <th className="text-left p-4">Subscriber</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Tags</th>
                      <th className="text-left p-4">Lists</th>
                      <th className="text-left p-4">Engagement</th>
                      <th className="text-left p-4">Joined</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <Checkbox
                            checked={selectedSubscribers.includes(subscriber.id)}
                            onCheckedChange={() => handleSelectSubscriber(subscriber.id)}
                            data-testid={`checkbox-subscriber-${subscriber.id}`}
                          />
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium" data-testid={`text-subscriber-name-${subscriber.id}`}>
                              {subscriber.firstName} {subscriber.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground" data-testid={`text-subscriber-email-${subscriber.id}`}>
                              {subscriber.email}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(subscriber.status)} data-testid={`badge-status-${subscriber.id}`}>
                            {subscriber.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {subscriber.tags?.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs" data-testid={`tag-${tag}-${subscriber.id}`}>
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-muted-foreground" data-testid={`text-lists-${subscriber.id}`}>
                            {subscriber.listNames?.join(", ")}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm" data-testid={`text-engagement-${subscriber.id}`}>
                            {subscriber.engagementScore}%
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-muted-foreground" data-testid={`text-joined-${subscriber.id}`}>
                            {subscriber.subscriptionDate?.toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm" data-testid={`button-subscriber-actions-${subscriber.id}`}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lists" className="space-y-6">
          {/* List Controls */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Subscriber Lists</h3>
            <Dialog open={showCreateList} onOpenChange={setShowCreateList}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-list">
                  <Plus className="w-4 h-4 mr-2" />
                  Create List
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New List</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="list-name">List Name</Label>
                    <Input id="list-name" placeholder="VIP Customers" data-testid="input-list-name" />
                  </div>
                  <div>
                    <Label htmlFor="list-description">Description</Label>
                    <Textarea 
                      id="list-description" 
                      placeholder="High-value customers with special offers"
                      data-testid="textarea-list-description"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateList(false)}>
                      Cancel
                    </Button>
                    <Button data-testid="button-save-list">Create List</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Lists Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockLists.map((list) => (
              <Card key={list.id} data-testid={`card-list-${list.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base" data-testid={`text-list-name-${list.id}`}>
                      {list.name}
                    </CardTitle>
                    <Button variant="ghost" size="sm" data-testid={`button-list-actions-${list.id}`}>
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4" data-testid={`text-list-description-${list.id}`}>
                    {list.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subscribers</span>
                    <span className="font-medium" data-testid={`text-list-count-${list.id}`}>
                      {list.subscriberCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1" data-testid={`button-view-list-${list.id}`}>
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" data-testid={`button-edit-list-${list.id}`}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="segments">
          <Card data-testid="card-segments-placeholder">
            <CardHeader>
              <CardTitle>Advanced Segmentation</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Advanced segmentation coming soon</h3>
                <p className="text-muted-foreground">Create dynamic segments based on behavior, engagement, and custom fields</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}