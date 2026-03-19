import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Brain,
  CheckCircle,
  Clock,
  FileSpreadsheet,
  Lightbulb,
  Upload,
} from "lucide-react";

export function ImportTab() {
  const { toast } = useToast();

  const [dataImport, setDataImport] = useState({
    processing: false,
    lastImport: null as string | null,
    supportedFormats: ["CSV", "Excel", "JSON", "XML"],
  });

  const [importFile, setImportFile] = useState<File | null>(null);

  const handleDataImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      setDataImport((prev) => ({ ...prev, processing: true }));

      // Simulate AI processing
      setTimeout(() => {
        setDataImport((prev) => ({
          ...prev,
          processing: false,
          lastImport: new Date().toISOString(),
        }));
        setImportFile(null);

        toast({
          title: "Data Import Complete",
          description:
            "AI has successfully processed and imported your data. All records have been categorized and organized.",
        });
      }, 5000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI-Powered Data Import
        </CardTitle>
        <p className="text-sm text-gray-600">
          Import and organize your existing business data with AI
          assistance.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <Label>Supported Data Types</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Customer & Company Data</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Sales Orders & Quotes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Purchase Orders</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Product Catalogs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Artwork & Files</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Estimates & Proofing</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <Label>Supported Formats</Label>
            <div className="grid grid-cols-2 gap-2">
              {dataImport.supportedFormats.map((format) => (
                <div
                  key={format}
                  className="flex items-center gap-2 p-2 border rounded"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">{format}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <Label>Import Data</Label>
          {dataImport.processing ? (
            <div className="border rounded-lg p-6 text-center">
              <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
              <h3 className="font-medium mb-2">
                AI Processing Your Data
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Our AI is analyzing and categorizing your import file.
                This may take a few minutes.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 animate-spin" />
                <span className="text-sm">Processing...</span>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Upload Your Data File</h3>
              <p className="text-sm text-gray-600 mb-4">
                Select a file containing your business data. Our AI will
                automatically detect and organize:
              </p>
              <Input
                type="file"
                accept=".csv,.xlsx,.json,.xml"
                onChange={handleDataImport}
                className="max-w-xs mx-auto"
              />
            </div>
          )}
        </div>

        {dataImport.lastImport && (
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">
                  Last Import Successful
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  Completed:{" "}
                  {new Date(
                    dataImport.lastImport,
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-amber-50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900">
                AI Import Process
              </h4>
              <p className="text-sm text-amber-700 mt-1">
                Our AI will intelligently categorize your data, match
                customer information, organize orders by status, and
                maintain data relationships. Review suggested matches
                before finalizing.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
