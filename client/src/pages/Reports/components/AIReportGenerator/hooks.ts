import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useReportSuggestions,
  useGenerateReport,
  useReportTemplates,
  useCreateReportTemplate,
  useDeleteReportTemplate,
} from "@/services/reports";
import type { GeneratedReport, ReportSuggestion } from "./types";

export function useAIReportGenerator() {
  const { toast } = useToast();
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState("");
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);

  const { data: suggestions } = useReportSuggestions() as unknown as {
    data: ReportSuggestion[] | undefined;
  };

  const { data: savedTemplates } = useReportTemplates();
  const createTemplateMutation = useCreateReportTemplate();
  const deleteTemplateMutation = useDeleteReportTemplate();

  const generateMutation = useGenerateReport();
  const isGenerating = generateMutation.isPending;

  const handleGenerateReport = () => {
    if (!naturalLanguageQuery.trim()) {
      toast({
        title: "Missing Query",
        description: "Please enter a report query in natural language.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate(naturalLanguageQuery, {
      onSuccess: (data) => {
        setGeneratedReport(data as unknown as GeneratedReport);
        toast({
          title: "Report Generated",
          description: "Your AI-powered report has been created successfully.",
        });
      },
      onError: (error: Error) =>
        toast({
          title: "Generation Failed",
          description: error.message,
          variant: "destructive",
        }),
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "sales":
        return "bg-green-100 text-green-800";
      case "operations":
        return "bg-blue-100 text-blue-800";
      case "customers":
        return "bg-purple-100 text-purple-800";
      case "vendors":
        return "bg-orange-100 text-orange-800";
      case "finance":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const exampleQueries = [
    "What are our margins for the last 6 weeks?",
    "Please list our top vendor spends this year and who our contacts are",
    "I need a commissions report for this month's orders by salesperson",
    "Show me customer spending trends for the last quarter",
    "Which products have the highest profit margins?",
    "List all orders that are overdue for delivery",
    "Compare this year's Q1 performance vs last year",
    "Show me customers who haven't ordered in the last 90 days",
  ];

  const handleSaveAsTemplate = () => {
    if (!generatedReport) return;
    createTemplateMutation.mutate(
      {
        name: generatedReport.name,
        query: generatedReport.query,
        description: generatedReport.summary,
      },
      {
        onSuccess: () =>
          toast({ title: "Template Saved", description: "Report saved as a reusable template." }),
        onError: (err: Error) =>
          toast({ title: "Save Failed", description: err.message, variant: "destructive" }),
      },
    );
  };

  const handleDeleteTemplate = (id: string) => {
    deleteTemplateMutation.mutate(id, {
      onSuccess: () => toast({ title: "Template Deleted" }),
      onError: (err: Error) =>
        toast({ title: "Delete Failed", description: err.message, variant: "destructive" }),
    });
  };

  const handleExportCsv = () => {
    if (!generatedReport?.data?.length) return;
    const headers = Object.keys(generatedReport.data[0]);
    const rows = generatedReport.data.map((row) =>
      headers.map((h) => {
        const val = row[h];
        const str = val == null ? "" : String(val);
        return str.includes(",") || str.includes('"')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${generatedReport.name || "report"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    naturalLanguageQuery,
    setNaturalLanguageQuery,
    isGenerating,
    suggestions,
    generatedReport,
    savedTemplates,
    handleGenerateReport,
    handleSaveAsTemplate,
    handleDeleteTemplate,
    isSavingTemplate: createTemplateMutation.isPending,
    getCategoryColor,
    exampleQueries,
    handleExportCsv,
  };
}
