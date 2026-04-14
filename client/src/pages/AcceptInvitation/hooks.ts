import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useLocation } from "@/lib/wouter-compat";
import { verifyInvitationToken, acceptInvitation } from "@/services/users";

export function useAcceptInvitation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [token, setToken] = useState("");
  const [invitationData, setInvitationData] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  const [errors, setErrors] = useState<any>({});

  const verifyInvitation = async (inviteToken: string) => {
    try {
      const data = await verifyInvitationToken<any>(inviteToken);
      if (data?.valid) {
        setInvitationData(data);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid Invitation",
          description: data?.message || "This invitation link is invalid or has expired",
        });
        setTimeout(() => setLocation("/"), 3000);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to verify invitation",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get("token");

    if (!inviteToken) {
      toast({
        variant: "destructive",
        title: "Invalid Link",
        description: "No invitation token found",
      });
      setLocation("/");
      return;
    }

    setToken(inviteToken);
    verifyInvitation(inviteToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateForm = () => {
    const newErrors: any = {};

    if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!/[a-z]/.test(formData.password)) {
      newErrors.password = "Password must contain lowercase letter";
    }

    if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = "Password must contain uppercase letter";
    }

    if (!/[0-9]/.test(formData.password)) {
      newErrors.password = "Password must contain number";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.firstName) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName) {
      newErrors.lastName = "Last name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await acceptInvitation(token, {
        username: formData.username,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      setSuccess(true);
      toast({
        title: "Account Created!",
        description: "Your account has been created successfully. Redirecting to login...",
      });
      setTimeout(() => setLocation("/"), 2000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to create account",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    invitationData,
    isVerifying,
    isSubmitting,
    success,
    formData,
    setFormData,
    errors,
    handleSubmit,
  };
}
