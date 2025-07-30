import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Box } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
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

          <Button 
            onClick={handleLogin}
            className="w-full bg-swag-primary hover:bg-swag-primary/90 text-white"
            size="lg"
          >
            Sign In to Continue
          </Button>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Secure authentication powered by Replit
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
