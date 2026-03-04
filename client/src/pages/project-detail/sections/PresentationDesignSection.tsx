import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  Image,
  Palette,
  Type,
  Upload,
} from "lucide-react";
import type { useProjectData } from "../hooks/useProjectData";

interface PresentationDesignSectionProps {
  orderId: string;
  data: ReturnType<typeof useProjectData>;
}

export default function PresentationDesignSection({ orderId, data }: PresentationDesignSectionProps) {
  const { companyName, companyData } = data;
  const [primaryColor, setPrimaryColor] = useState("#0f766e");
  const [headerStyle, setHeaderStyle] = useState("banner");
  const [fontFamily, setFontFamily] = useState("default");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Presentation Design
          </h2>
          <p className="text-sm text-gray-500">
            Customize how the presentation looks to your client
          </p>
        </div>
        <Button size="sm" className="gap-1">
          <Eye className="w-4 h-4" />
          Preview
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Image className="w-4 h-4" />
              Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Company Logo */}
            <div>
              <Label className="text-xs text-gray-500">Company Logo</Label>
              <div className="mt-1 border-2 border-dashed rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">Drop logo here or click to upload</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG up to 5MB</p>
              </div>
            </div>

            {/* Company Name Override */}
            <div>
              <Label className="text-xs text-gray-500">Company Name</Label>
              <Input defaultValue={companyData?.name || companyName} className="mt-1" />
            </div>

            {/* Primary Color */}
            <div>
              <Label className="text-xs text-gray-500">Primary Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-gray-200"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-28"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Layout & Typography */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Type className="w-4 h-4" />
              Layout & Typography
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Header Style */}
            <div>
              <Label className="text-xs text-gray-500">Header Style</Label>
              <Select value={headerStyle} onValueChange={setHeaderStyle}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banner">Banner with Logo</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="centered">Centered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Font */}
            <div>
              <Label className="text-xs text-gray-500">Font Family</Label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">System Default</SelectItem>
                  <SelectItem value="inter">Inter</SelectItem>
                  <SelectItem value="roboto">Roboto</SelectItem>
                  <SelectItem value="poppins">Poppins</SelectItem>
                  <SelectItem value="playfair">Playfair Display</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Footer Text */}
            <div>
              <Label className="text-xs text-gray-500">Footer Text</Label>
              <Textarea
                placeholder="Custom footer message (e.g., Thank you for your business!)"
                className="mt-1 min-h-[60px] resize-none"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Card */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Live Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mini preview of the presentation header */}
          <div
            className="rounded-lg overflow-hidden border"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Image className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold">{companyData?.name || companyName}</h3>
                  <p className="text-white/80 text-sm">Presentation for your project</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <Image className="w-8 h-8 text-gray-300" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
