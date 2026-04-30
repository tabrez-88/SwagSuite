import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  Download,
  Play,
  Copy,
  BarChart3,
  FileText,
} from "lucide-react";
import { useAIReportGenerator } from "./hooks";

export function AIReportGenerator() {
  const {
    naturalLanguageQuery,
    setNaturalLanguageQuery,
    isGenerating,
    suggestions,
    generatedReport,
    handleGenerateReport,
    getCategoryColor,
    exampleQueries,
    handleExportCsv,
  } = useAIReportGenerator();

  const dataColumns = generatedReport?.data?.length
    ? Object.keys(generatedReport.data[0])
    : [];

  return (
    <div className="space-y-6">
      {/* AI Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Report Generator
          </CardTitle>
          <CardDescription>
            Generate comprehensive reports using natural language queries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-query">What report would you like to generate?</Label>
            <Textarea
              id="report-query"
              placeholder="Describe the report you need in plain English..."
              value={naturalLanguageQuery}
              onChange={(e) => setNaturalLanguageQuery(e.target.value)}
              rows={3}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              <p className="text-sm text-muted-foreground mb-2">Example queries:</p>
              {exampleQueries.slice(0, 4).map((query, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setNaturalLanguageQuery(query)}
                  className="text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  {query}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating || !naturalLanguageQuery.trim()}
            className="w-full bg-swag-primary hover:bg-swag-primary/90"
          >
            {isGenerating ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Report Result */}
      {generatedReport && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {generatedReport.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(generatedReport.generatedAt).toLocaleString()}
                </span>
                <Button size="sm" variant="outline" onClick={handleExportCsv}>
                  <Download className="h-3 w-3 mr-1" />
                  CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* AI Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">{generatedReport.summary}</p>
            </div>

            {/* Data Table */}
            {generatedReport.data.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        {dataColumns.map((col) => (
                          <th key={col} className="text-left px-3 py-2 font-medium text-gray-700 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {generatedReport.data.map((row, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          {dataColumns.map((col) => (
                            <td key={col} className="px-3 py-2 whitespace-nowrap">
                              {row[col] == null ? "—" : String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {generatedReport.data.length > 50 && (
                  <div className="px-3 py-2 bg-gray-50 border-t text-xs text-muted-foreground text-center">
                    Showing {generatedReport.data.length} rows
                  </div>
                )}
              </div>
            )}

            {generatedReport.data.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                No data returned for this query.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Report Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Suggested Reports
            </CardTitle>
            <CardDescription>
              AI-curated report suggestions based on your business data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{suggestion.title}</h4>
                    <Badge className={getCategoryColor(suggestion.category)}>
                      {suggestion.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setNaturalLanguageQuery(suggestion.query)}
                    className="w-full"
                  >
                    <Play className="h-3 w-3 mr-2" />
                    Use This Query
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
