import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Box, Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/providers/ThemeProvider";

type LoginStep = "welcome" | "credentials" | "2fa";

export default function Landing() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginStep, setLoginStep] = useState<LoginStep>("welcome");
  const [tempToken, setTempToken] = useState("");
  const [twoFaCode, setTwoFaCode] = useState(["", "", "", "", "", ""]);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState("");
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
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
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: data.message || "Invalid username or password",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to login. Please try again.",
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
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tempToken, code }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({ title: "Login Successful", description: "Welcome back!" });
        const redirectTo = sessionStorage.getItem("redirectAfterLogin") || "/";
        sessionStorage.removeItem("redirectAfterLogin");
        window.location.href = redirectTo;
      } else {
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: data.message || "Invalid code",
        });
        // Reset code inputs
        setTwoFaCode(["", "", "", "", "", ""]);
        setBackupCode("");
        if (!useBackupCode) inputRefs.current[0]?.focus();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Verification failed. Please try again.",
      });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-swag-dark via-swag-accent to-swag-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 px-8">
          <div className="text-center mb-8">
            <div className="flex justify-center">
              {theme?.logoUrl ? (
                <img src={theme.logoUrl} alt={theme?.companyName || 'Logo'} className="h-20 object-contain" />
              ) : (
                <div className="w-16 h-16 bg-swag-primary rounded-xl flex items-center justify-center">
                  <Box className="text-white" size={32} />
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{theme?.companyName || 'SwagSuite'}</h1>
            {theme?.tagline && <p className="text-gray-600 mb-1">{theme.tagline}</p>}
            <p className="text-sm text-gray-500">Order Management System</p>
          </div>

          {/* Welcome Screen */}
          {loginStep === "welcome" && (
            <>
              <div className="space-y-4 mb-8">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to SwagSuite</h2>
                  <p className="text-gray-600 text-sm mb-6">
                    Your comprehensive order management system for promotional products.
                    Streamline your workflow from quote to delivery.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {["Order Management & CRM", "AI-Powered Search & Analytics", "Supplier & Inventory Management", "Real-time Reporting & Dashboards"].map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-swag-primary rounded-full" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Button onClick={() => setLoginStep("credentials")} className="w-full bg-swag-primary hover:bg-swag-primary/90 text-white" size="lg">
                  Sign In
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Dev</span>
                  </div>
                </div>
                <Button onClick={() => { window.location.href = "/api/login/dev"; }} variant="outline" className="w-full" size="lg">
                  Quick Dev Login (Auto)
                </Button>
                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500">Need an account? Contact your administrator for an invitation.</p>
                </div>
              </div>
            </>
          )}

          {/* Credentials Form */}
          {loginStep === "credentials" && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Sign In</h2>
              <form onSubmit={handleLocalLogin} className="space-y-4">
                <div>
                  <Label htmlFor="username">Username or Email</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username or email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-swag-primary hover:bg-swag-primary/90" disabled={isLoading}>
                  {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</>) : "Sign In"}
                </Button>
              </form>
              <div className="mt-4">
                <Button variant="ghost" className="w-full text-sm text-gray-600 hover:text-gray-900" onClick={() => setLoginStep("welcome")} disabled={isLoading}>
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* 2FA Verification */}
          {loginStep === "2fa" && (
            <div className="mb-6">
              <div className="text-center mb-6">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <ShieldCheck className="text-blue-600" size={24} />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Two-Factor Authentication</h2>
                <p className="text-sm text-gray-500">
                  {useBackupCode
                    ? "Enter one of your backup codes"
                    : "Enter the 6-digit code from your authenticator app"}
                </p>
              </div>

              <form onSubmit={handle2FAVerify} className="space-y-4">
                {!useBackupCode ? (
                  <div className="flex justify-center gap-2" onPaste={handleOTPPaste}>
                    {twoFaCode.map((digit, i) => (
                      <Input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOTPChange(i, e.target.value)}
                        onKeyDown={(e) => handleOTPKeyDown(i, e)}
                        className="w-12 h-14 text-center text-2xl font-mono"
                        disabled={isLoading}
                        autoComplete="one-time-code"
                      />
                    ))}
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="backupCode">Backup Code</Label>
                    <Input
                      id="backupCode"
                      type="text"
                      placeholder="xxxx-xxxx"
                      value={backupCode}
                      onChange={(e) => setBackupCode(e.target.value)}
                      className="mt-1 text-center font-mono text-lg tracking-wider"
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-swag-primary hover:bg-swag-primary/90"
                  disabled={isLoading || (!useBackupCode && twoFaCode.some((d) => !d)) || (useBackupCode && !backupCode.trim())}
                >
                  {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</>) : "Verify"}
                </Button>
              </form>

              <div className="mt-4 space-y-2">
                <Button
                  variant="ghost"
                  className="w-full text-sm text-gray-600"
                  onClick={() => {
                    setUseBackupCode(!useBackupCode);
                    setBackupCode("");
                    setTwoFaCode(["", "", "", "", "", ""]);
                  }}
                  disabled={isLoading}
                >
                  {useBackupCode ? "Use authenticator code instead" : "Use a backup code instead"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-sm text-gray-500"
                  onClick={resetToCredentials}
                  disabled={isLoading}
                >
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Back to sign in
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
