import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Shield, Users, Crown, User as UserIcon, UserPlus, Mail, Copy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  token: string;
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
}

const roleConfig = {
  admin: {
    label: "Admin",
    icon: Crown,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
  manager: {
    label: "Manager",
    icon: Shield,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  user: {
    label: "User",
    icon: UserIcon,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
};

export default function UsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [invitationUrl, setInvitationUrl] = useState("");

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const { data: pendingInvitations = [] } = useQuery<PendingInvitation[]>({
    queryKey: ["/api/invitations/pending"],
    enabled: currentUser?.role === "admin" || currentUser?.role === "manager",
  });

  const isAdmin = currentUser?.role === "admin";
  const canInvite = currentUser?.role === "admin" || currentUser?.role === "manager";

  // Debug: Log current user info
  console.log("Current user:", currentUser);
  console.log("Can invite:", canInvite, "Role:", currentUser?.role);

  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const response = await apiRequest("POST", "/api/invitations", { email, role });
      return response.json();
    },
    onSuccess: (data) => {
      setInvitationUrl(data.invitationUrl);
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteEmail}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations/pending"] });
      setInviteEmail("");
      setInviteRole("user");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  const handleInviteUser = () => {
    if (!inviteEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    inviteUserMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const copyInvitationUrl = () => {
    navigator.clipboard.writeText(invitationUrl);
    toast({
      title: "Copied",
      description: "Invitation URL copied to clipboard",
    });
  };

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiRequest("PATCH", `/api/users/${userId}/role`, { role });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  const getRoleConfig = (role: string) => {
    return roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>Manage user roles and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-1">Manage user roles and permissions</p>
        </div>
        
        {canInvite && (
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-swag-primary hover:bg-swag-dark">
                <UserPlus className="mr-2 h-4 w-4" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New User</DialogTitle>
                <DialogDescription>
                  Send an invitation email to add a new user to the system
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      {isAdmin && <SelectItem value="admin">Admin</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                {invitationUrl && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm font-medium text-green-900 mb-2">
                      Invitation sent successfully!
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={invitationUrl}
                        readOnly
                        className="text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copyInvitationUrl}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setInviteDialogOpen(false);
                    setInvitationUrl("");
                  }}
                >
                  Close
                </Button>
                <Button
                  onClick={handleInviteUser}
                  disabled={inviteUserMutation.isPending}
                  className="bg-swag-primary hover:bg-swag-dark"
                >
                  {inviteUserMutation.isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Pending Invitations */}
      {pendingInvitations && pendingInvitations.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5" />
              Pending Invitations ({pendingInvitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{inv.email}</p>
                    <p className="text-sm text-gray-500">
                      Role: {inv.role} • Expires: {format(new Date(inv.expiresAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                    Pending
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage user roles and permissions. {!isAdmin && "Only admins can change user roles."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const config = getRoleConfig(user.role);
                const Icon = config.icon;
                
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.profileImageUrl} />
                          <AvatarFallback>
                            {getInitials(user.firstName, user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          {currentUser?.id === user.id && (
                            <Badge variant="outline" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      {isAdmin && currentUser?.id !== user.id ? (
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleRoleChange(user.id, value)}
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue>
                              <div className="flex items-center gap-2">
                                <Icon className={`h-4 w-4 ${config.color}`} />
                                <span>{config.label}</span>
                              </div>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <Crown className="h-4 w-4 text-yellow-600" />
                                <span>Admin</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="manager">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-blue-600" />
                                <span>Manager</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="user">
                              <div className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4 text-gray-600" />
                                <span>User</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          variant="outline"
                          className={`${config.bgColor} ${config.borderColor}`}
                        >
                          <Icon className={`h-3 w-3 mr-1 ${config.color}`} />
                          {config.label}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(user.createdAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(user.updatedAt), "MMM dd, yyyy")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {users.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
