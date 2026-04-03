import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Box, Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { useLanding } from "./hooks";
import { Separator } from "@/components/ui/separator";

export default function Landing() {
  const {
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
    handleLocalLogin,
    handle2FAVerify,
    handleOTPChange,
    handleOTPKeyDown,
    handleOTPPaste,
    resetToCredentials,
    toggleBackupCode,
  } = useLanding();

  return (
    <div className="min-h-screen p-4 flex h-screen items-center justify-center relative">
      <div className="hidden sm:flex w-full justify-center items-center bg-black p-4 h-full rounded-lg overflow-hidden relative" >
        <img src="/bg-login.webp" alt="Background Login" className="absolute inset-0 w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 max-w-md text-white space-y-6">
          <img src="/LSD_Logo.webp" alt="" />
        </div>
      </div>
      <Card className="w-full max-w-md border-0 shadow-none">
        <CardContent >
          <div className="text-center mb-4">
            <div className="flex justify-center">
              {theme?.logoUrl ? (
                <img src={theme.logoUrl} alt={theme?.companyName || 'Logo'} className="h-24 object-contain" />
              ) : (
                <div className="w-16 h-16 bg-swag-primary rounded-xl flex items-center justify-center">
                  <Box className="text-white" size={32} />
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{theme?.companyName || 'SwagSuite'}</h1>
            {theme?.tagline && <p className="text-gray-600 mb-1">{theme.tagline}</p>}
            <p className="text-sm text-gray-500">Order Management System</p>
          </div>
          <Separator className="mb-4" />
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
                <div className="grid grid-cols-1 gap-2 text-sm pl-8">
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
                <Button onClick={() => { window.location.href = "/api/login/dev"; }} variant="outline" className="w-full hover:text-gray-900" size="lg">
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

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={trustDevice}
                    onChange={(e) => setTrustDevice(e.target.checked)}
                    className="rounded border-gray-300 text-swag-primary focus:ring-swag-primary h-4 w-4"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-gray-600">Trust this device for 30 days</span>
                </label>

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
                  onClick={toggleBackupCode}
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
