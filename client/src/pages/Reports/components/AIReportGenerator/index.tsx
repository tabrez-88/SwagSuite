import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  FileText,
  Download,
  Clock,
  Play,
  Save,
  Trash2,
  Copy,
  BarChart3,
} from "lucide-react";
import { useAIReportGenerator } from "./hooks";

export function AIReportGenerator() {
  const {
    naturalLanguageQuery,
    setNaturalLanguageQuery,
    isGenerating,
    templates,
    suggestions,
    recentReports,
    runTemplateMutation,
    handleGenerateReport,
    handleSaveAsTemplate,
    getCategoryColor,
    exampleQueries,
  } = useAIReportGenerator();

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

          <div className="flex gap-2">
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating || !naturalLanguageQuery.trim()}
              className="flex-1"
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
            <Button
              variant="outline"
              onClick={handleSaveAsTemplate}
              disabled={!naturalLanguageQuery.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Suggestions */}
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
            {suggestions?.map((suggestion, index) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Saved Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Saved Templates
            </CardTitle>
            <CardDescription>
              Reusable report templates for recurring analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80 w-full">
              <div className="space-y-3">
                {templates?.map((template) => (
                  <div key={template.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{template.name}</h4>
                      <div className="flex items-center gap-1">
                        {template.schedule && (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Scheduled
                          </Badge>
                        )}
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    {template.lastRun && (
                      <p className="text-xs text-muted-foreground">
                        Last run: {new Date(template.lastRun).toLocaleString()}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => runTemplateMutation.mutate(template.id)}
                        disabled={runTemplateMutation.isPending}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Run
                      </Button>
                      <Button size="sm" variant="outline">
                        <Copy className="h-3 w-3 mr-1" />
                        Clone
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Reports
            </CardTitle>
            <CardDescription>
              Your recently generated reports and exports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80 w-full">
              <div className="space-y-3">
                {recentReports?.map((report) => (
                  <div key={report.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{report.name}</h4>
                      <span className="text-xs text-muted-foreground">
                        {new Date(report.generatedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Query: "{report.query}"
                    </p>
                    <p className="text-sm">{report.summary}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <FileText className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      {report.exportFormats.map((format) => (
                        <Button key={format} size="sm" variant="ghost">
                          <Download className="h-3 w-3 mr-1" />
                          {format.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
