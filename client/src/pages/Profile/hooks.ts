import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Crown, Shield, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface User {
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

export const roleConfig = {
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

export function useProfile() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [mailCredentialsOpen, setMailCredentialsOpen] = useState(false);

    const { data: user, isLoading, dataUpdatedAt } = useQuery<User>({
        queryKey: ["/api/auth/user"],
        queryFn: async () => {
            const res = await fetch("/api/auth/user", {
                credentials: "include",
            });

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

    const uploadAvatarMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await fetch('/api/users/avatar', {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to upload avatar');
            }

            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Avatar uploaded successfully",
            });
            queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message || "Failed to upload avatar",
                variant: "destructive",
            });
        },
        onSettled: () => {
            setIsUploading(false);
        },
    });

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast({
                title: "Invalid file type",
                description: "Please select an image file",
                variant: "destructive",
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Please select an image smaller than 5MB",
                variant: "destructive",
            });
            return;
        }

        setIsUploading(true);
        uploadAvatarMutation.mutate(file);
    };

    const isNewlyRegistered = user && dataUpdatedAt &&
        new Date(user.createdAt).getTime() > (Date.now() - 5000);

    useEffect(() => {
        if (!isLoading && !user) {
            window.location.href = '/api/login';
        }
    }, [isLoading, user]);

    const getInitials = () => {
        if (!user) return "U";
        return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";
    };

    const config = user
        ? roleConfig[user.role as keyof typeof roleConfig] || roleConfig.user
        : roleConfig.user;

    return {
        user,
        isLoading,
        isUploading,
        isNewlyRegistered,
        fileInputRef,
        mailCredentialsOpen,
        setMailCredentialsOpen,
        config,
        getInitials,
        handleAvatarClick,
        handleFileChange,
    };
}
