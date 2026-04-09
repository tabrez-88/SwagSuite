import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  FileSpreadsheet,
  Upload,
  Users,
  Building2,
  Loader2,
  CheckCircle2,
  XCircle,
  SkipForward,
  RotateCcw,
} from "lucide-react";
import { useImportTab } from "./hooks";

export function ImportTab() {
  const {
    entity,
    file,
    preview,
    mapping,
    summary,
    fields,
    previewMutation,
    importMutation,
    handleFileSelect,
    handleEntityChange,
    updateMapping,
    reset,
  } = useImportTab();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          CSV Data Import
        </CardTitle>
        <p className="text-sm text-gray-600">
          Import companies and contacts from a CSV file. Map your CSV columns
          to SwagSuite fields, preview the data, then run the import.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Entity selector */}
        <div className="flex gap-2">
          <Button
            variant={entity === "companies" ? "default" : "outline"}
            onClick={() => handleEntityChange("companies")}
            className="gap-2"
          >
            <Building2 className="w-4 h-4" />
            Companies
          </Button>
          <Button
            variant={entity === "contacts" ? "default" : "outline"}
            onClick={() => handleEntityChange("contacts")}
            className="gap-2"
          >
            <Users className="w-4 h-4" />
            Contacts
          </Button>
        </div>

        {/* File upload */}
        {!preview && !summary && (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium mb-2">
              Upload {entity === "companies" ? "Companies" : "Contacts"} CSV
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Select a CSV file. The first row should contain column headers.
            </p>
            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileSelect}
              className="max-w-xs mx-auto"
              disabled={previewMutation.isPending}
            />
            {previewMutation.isPending && (
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Parsing CSV...
              </div>
            )}
          </div>
        )}

        {/* Column mapping + preview */}
        {preview && !summary && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Map CSV Columns → {entity === "companies" ? "Company" : "Contact"} Fields</Label>
                <span className="text-xs text-gray-500">
                  {preview.totalRows} rows detected • {file?.name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 border rounded-lg p-4 bg-gray-50">
                {preview.headers.map((header) => (
                  <div key={header} className="flex items-center gap-2">
                    <span className="text-sm font-mono text-gray-700 w-32 truncate">
                      {header}
                    </span>
                    <span className="text-gray-400">→</span>
                    <Select
                      value={mapping[header] || "__skip__"}
                      onValueChange={(v) =>
                        updateMapping(header, v === "__skip__" ? "" : v)
                      }
                    >
                      <SelectTrigger className="flex-1 h-8 text-sm">
                        <SelectValue placeholder="Skip column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__skip__">
                          <span className="text-gray-500">— Skip —</span>
                        </SelectItem>
                        {fields.map((f) => (
                          <SelectItem key={f.key} value={f.key}>
                            {f.label}
                            {("required" in f && f.required) && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview table */}
            <div className="space-y-2">
              <Label>Preview (first {preview.rows.length} rows)</Label>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {fields.map((f) => (
                        <TableHead key={f.key} className="text-xs">
                          {f.label}
                          {("required" in f && f.required) && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.rows.slice(0, 5).map((row, idx) => {
                      // Build per-row mapped data using current mapping
                      const mapped: Record<string, string> = {};
                      for (const [header, canonical] of Object.entries(mapping)) {
                        if (canonical && preview.rows[idx]) {
                          // preview data is mapped using initial mapping from server;
                          // re-project using live UI mapping by reading the raw row keys
                          mapped[canonical] = (row as any)[canonical] ?? "";
                        }
                      }
                      return (
                        <TableRow key={idx}>
                          {fields.map((f) => (
                            <TableCell key={f.key} className="text-xs max-w-[150px] truncate">
                              {(row as any)[f.key] ?? ""}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={reset}>
                Cancel
              </Button>
              <Button
                onClick={() => importMutation.mutate()}
                disabled={importMutation.isPending}
                className="gap-2"
              >
                {importMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Import {preview.totalRows} Rows
              </Button>
            </div>
          </>
        )}

        {/* Results summary */}
        {summary && (
          <>
            <Separator />
            <div className="grid grid-cols-4 gap-3">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="text-xs text-gray-600">Total</div>
                <div className="text-2xl font-semibold">{summary.total}</div>
              </div>
              <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                <div className="flex items-center gap-1 text-xs text-green-700">
                  <CheckCircle2 className="w-3 h-3" /> Succeeded
                </div>
                <div className="text-2xl font-semibold text-green-700">
                  {summary.succeeded}
                </div>
              </div>
              <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                <div className="flex items-center gap-1 text-xs text-red-700">
                  <XCircle className="w-3 h-3" /> Failed
                </div>
                <div className="text-2xl font-semibold text-red-700">
                  {summary.failed}
                </div>
              </div>
              <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                <div className="flex items-center gap-1 text-xs text-yellow-700">
                  <SkipForward className="w-3 h-3" /> Skipped
                </div>
                <div className="text-2xl font-semibold text-yellow-700">
                  {summary.skipped}
                </div>
              </div>
            </div>

            {(summary.failed > 0 || summary.skipped > 0) && (
              <div className="space-y-2">
                <Label>Issues</Label>
                <div className="border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Row</TableHead>
                        <TableHead className="w-24">Status</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.results
                        .filter((r) => r.status !== "success")
                        .map((r, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-xs">
                              {r.row}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={
                                  r.status === "failed"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }
                              >
                                {r.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-gray-600">
                              {r.error || "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={reset} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Import Another File
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
