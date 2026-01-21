import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, Mail, Calendar, User as UserIcon, Crown, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
    role: string;
    emailReportsEnabled: boolean;
    createdAt: string;
    updatedAt: string;
}

const roleConfig = {
    admin: {
        label: "Administrator",
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

export default function ProfilePage() {
    const { data: user, isLoading, dataUpdatedAt } = useQuery<User>({
        queryKey: ["/api/auth/user"],
        queryFn: async () => {
            const res = await fetch("/api/auth/user", {
                credentials: "include",
            });
            
            // Return null if unauthorized instead of throwing
            if (res.status === 401) {
                return null;
            }
            
            if (!res.ok) {
                throw new Error(`${res.status}: ${res.statusText}`);
            }
            
            return res.json();
        },
        refetchOnMount: true,
    });

    // Check if user was just registered (created within last 5 seconds)
    const isNewlyRegistered = user && dataUpdatedAt && 
        new Date(user.createdAt).getTime() > (Date.now() - 5000);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isLoading && !user) {
            window.location.href = '/api/login';
        }
    }, [isLoading, user]);

    if (isLoading) {
        return (
            <div className="container mx-auto py-8 max-w-4xl">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-20 w-20 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container mx-auto py-8 max-w-4xl">
                <Card>
                    <CardContent className="p-12 text-center">
                        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            User Not Found in Database
                        </h3>
                        <p className="text-gray-600">
                            Your account is authenticated but not found in the database.
                            Please contact an administrator.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const config = roleConfig[user.role as keyof typeof roleConfig] || roleConfig.user;
    const Icon = config.icon;
    const getInitials = () => {
        return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";
    };

    return (
        <div className="container mx-auto py-8 max-w-4xl space-y-6">
            {/* Profile Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-6">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user.profileImageUrl} />
                            <AvatarFallback className="text-2xl">
                                {getInitials()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <CardTitle className="text-2xl mb-2">
                                {user.firstName} {user.lastName}
                            </CardTitle>
                            <div className="flex items-center gap-2 mb-2">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600">{user.email}</span>
                            </div>
                            <Badge
                                variant="outline"
                                className={`${config.bgColor} ${config.borderColor}`}
                            >
                                <Icon className={`h-4 w-4 mr-1 ${config.color}`} />
                                {config.label}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Account Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Account Status
                    </CardTitle>
                    <CardDescription>Your account is registered in the database</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                            <UserIcon className="h-5 w-5 text-blue-600" />
                            <div>
                                <p className="text-sm text-gray-600">User ID</p>
                                <p className="font-mono text-sm">{user.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                            <Shield className="h-5 w-5 text-purple-600" />
                            <div>
                                <p className="text-sm text-gray-600">Role</p>
                                <p className="font-medium">{config.label}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                            <Calendar className="h-5 w-5 text-green-600" />
                            <div>
                                <p className="text-sm text-gray-600">Account Created</p>
                                <p className="font-medium">
                                    {format(new Date(user.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                            <Calendar className="h-5 w-5 text-orange-600" />
                            <div>
                                <p className="text-sm text-gray-600">Last Active</p>
                                <p className="font-medium">
                                    {format(new Date(user.updatedAt), "MMM dd, yyyy 'at' h:mm a")}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-medium text-green-900">
                                    ✅ Account Verified
                                </h4>
                                <p className="text-sm text-green-700 mt-1">
                                    Your Replit Auth account is successfully registered in the SwagSuite database.
                                    All features are available based on your role.
                                </p>
                            </div>
                        </div>
                    </div>

                    {isNewlyRegistered && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-medium text-blue-900">
                                        🎉 Welcome! Auto-Registered
                                    </h4>
                                    <p className="text-sm text-blue-700 mt-1">
                                        Your account was automatically registered just now. You're all set to use SwagSuite!
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Permissions */}
            <Card>
                <CardHeader>
                    <CardTitle>Permissions</CardTitle>
                    <CardDescription>What you can do with your {config.label} role</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {user.role === "admin" && (
                            <>
                                <li className="flex items-center gap-2 text-green-700">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Full system access
                                </li>
                                <li className="flex items-center gap-2 text-green-700">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Manage user roles and permissions
                                </li>
                                <li className="flex items-center gap-2 text-green-700">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Configure system settings
                                </li>
                                <li className="flex items-center gap-2 text-green-700">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Manage integrations
                                </li>
                            </>
                        )}
                        {user.role === "manager" && (
                            <>
                                <li className="flex items-center gap-2 text-blue-700">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Access all features
                                </li>
                                <li className="flex items-center gap-2 text-blue-700">
                                    <CheckCircle2 className="h-4 w-4" />
                                    View user list
                                </li>
                                <li className="flex items-center gap-2 text-blue-700">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Configure system settings
                                </li>
                                <li className="flex items-center gap-2 text-gray-500">
                                    <XCircle className="h-4 w-4" />
                                    Cannot modify user roles
                                </li>
                            </>
                        )}
                        {user.role === "user" && (
                            <>
                                <li className="flex items-center gap-2 text-gray-700">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Access CRM and Orders
                                </li>
                                <li className="flex items-center gap-2 text-gray-700">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Manage products and suppliers
                                </li>
                                <li className="flex items-center gap-2 text-gray-500">
                                    <XCircle className="h-4 w-4" />
                                    Limited access to settings
                                </li>
                            </>
                        )}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
