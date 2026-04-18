import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/providers/ThemeProvider";
import { loginUser, verify2FALogin } from "@/services/users/requests";

export type LoginStep = "welcome" | "credentials" | "2fa";

export function useLanding() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginStep, setLoginStep] = useState<LoginStep>("welcome");
  const [tempToken, setTempToken] = useState("");
  const [twoFaCode, setTwoFaCode] = useState(["", "", "", "", "", ""]);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { toast } = useToast();
  const { theme } = useTheme();

  // Auto-focus first OTP input when entering 2FA step
  useEffect(() => {
    if (loginStep === "2fa" && !useBackupCode) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [loginStep, useBackupCode]);

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await loginUser({ username, password });

      if (data.requires2FA) {
        setTempToken(data.tempToken);
        setLoginStep("2fa");
        toast({
          title: "Verification Required",
          description: "Enter the code from your authenticator app.",
        });
      } else {
        toast({ title: "Login Successful", description: "Welcome back!" });
        const redirectTo = sessionStorage.getItem("redirectAfterLogin") || "/";
        sessionStorage.removeItem("redirectAfterLogin");
        window.location.href = redirectTo;
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid username or password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const code = useBackupCode ? backupCode.trim() : twoFaCode.join("");

    try {
      const data = await verify2FALogin({ tempToken, code, trustDevice });

      toast({ title: "Login Successful", description: "Welcome back!" });
      const redirectTo = sessionStorage.getItem("redirectAfterLogin") || "/";
      sessionStorage.removeItem("redirectAfterLogin");
      window.location.href = redirectTo;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "Invalid code",
      });
      // Reset code inputs
      setTwoFaCode(["", "", "", "", "", ""]);
      setBackupCode("");
      if (!useBackupCode) inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP digit input
  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only digits

    const newCode = [...twoFaCode];
    newCode[index] = value.slice(-1); // Only last digit
    setTwoFaCode(newCode);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5 && newCode.every((d) => d !== "")) {
      const form = inputRefs.current[0]?.closest("form");
      if (form) {
        setTimeout(() => form.requestSubmit(), 50);
      }
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !twoFaCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste of full OTP code
  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split("");
      setTwoFaCode(newCode);
      inputRefs.current[5]?.focus();
      // Auto-submit
      setTimeout(() => {
        const form = inputRefs.current[0]?.closest("form");
        if (form) form.requestSubmit();
      }, 100);
    }
  };

  const resetToCredentials = () => {
    setLoginStep("credentials");
    setTempToken("");
    setTwoFaCode(["", "", "", "", "", ""]);
    setBackupCode("");
    setUseBackupCode(false);
  };

  const toggleBackupCode = () => {
    setUseBackupCode(!useBackupCode);
    setBackupCode("");
    setTwoFaCode(["", "", "", "", "", ""]);
  };

  return {
    // State
    username,
    setUsername,
    password,
    setPassword,
    isLoading,
    showPassword,
    setShowPassword,
    loginStep,
    setLoginStep,
    twoFaCode,
    useBackupCode,
    backupCode,
    setBackupCode,
    trustDevice,
    setTrustDevice,
    inputRefs,
    theme,

    // Handlers
    handleLocalLogin,
    handle2FAVerify,
    handleOTPChange,
    handleOTPKeyDown,
    handleOTPPaste,
    resetToCredentials,
    toggleBackupCode,
  };
}
