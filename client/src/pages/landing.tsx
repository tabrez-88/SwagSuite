import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Box, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const { toast } = useToast();

  // Check if we're in local dev mode (no REPL_ID or REPL_ID is "local-dev")
  const isLocalDev = !import.meta.env.VITE_REPL_ID || import.meta.env.VITE_REPL_ID === "local-dev";

  const handleOAuthLogin = () => {
    // In local dev, use dev auto-login endpoint
    window.location.href = isLocalDev ? "/api/login/dev" : "/api/login";
  };

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        // Refresh page to trigger auth check
        window.location.href = "/";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-swag-dark via-swag-accent to-swag-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 px-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-swag-primary rounded-xl flex items-center justify-center">
                <Box className="text-white" size={32} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">SwagSuite</h1>
            <p className="text-gray-600 mb-1">by Liquid Screen Design</p>
            <p className="text-sm text-gray-500">
              Promotional Products ERP System
            </p>
          </div>

          {!showLoginForm ? (
            <>
              <div className="space-y-4 mb-8">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Welcome to SwagSuite
                  </h2>
                  <p className="text-gray-600 text-sm mb-6">
                    Your comprehensive order management system for promotional products. 
                    Streamline your workflow from quote to delivery.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-swag-primary rounded-full"></div>
                    <span>Order Management & CRM</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-swag-primary rounded-full"></div>
                    <span>AI-Powered Search & Analytics</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-swag-primary rounded-full"></div>
                    <span>Supplier & Inventory Management</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-swag-primary rounded-full"></div>
                    <span>Real-time Reporting & Dashboards</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => setShowLoginForm(true)}
                  className="w-full bg-swag-primary hover:bg-swag-primary/90 text-white"
                  size="lg"
                >
                  Sign in with Username
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or</span>
                  </div>
                </div>

                <Button 
                  onClick={handleOAuthLogin}
                  variant="outline" 
                  className="w-full"
                  size="lg"
                >
                  {isLocalDev ? "Quick Dev Login (Auto)" : "Sign in with Replit"}
                </Button>

                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500">
                    Need an account? Contact your administrator for an invitation.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  Sign In
                </h2>
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
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-swag-primary hover:bg-swag-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
                
                <div className="mt-4 space-y-2">
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Or</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleOAuthLogin}
                    variant="outline" 
                    className="w-full"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLocalDev ? "Quick Dev Login (Auto)" : "Sign in with Replit"}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full text-sm text-gray-600 hover:text-gray-900"
                    onClick={() => setShowLoginForm(false)}
                    disabled={isLoading}
                  >
                    ← Back to options
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
