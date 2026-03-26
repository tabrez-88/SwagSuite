import { ShieldCheck } from "lucide-react";
import TwoFactorSettings from "@/components/shared/TwoFactorSettings";

export default function TwoFactorSetup() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-4">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Setup Two-Factor Authentication</h1>
          <p className="text-sm text-gray-500 mt-2">
            Two-factor authentication is required for all accounts. Please set up 2FA to continue using SwagSuite.
          </p>
        </div>
        <TwoFactorSettings />
      </div>
    </div>
  );
}
