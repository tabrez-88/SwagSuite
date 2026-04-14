import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useReportTemplates,
  useReportSuggestions,
  useRecentReports,
  useGenerateReport,
  useSaveReportTemplate,
  useRunReportTemplate,
} from "@/services/reports";
import type { ReportTemplate, GeneratedReport, ReportSuggestion } from "./types";

export function useAIReportGenerator() {
  const { toast } = useToast();
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: templates } = useReportTemplates() as unknown as { data: ReportTemplate[] | undefined };
  const { data: suggestions } = useReportSuggestions() as unknown as { data: ReportSuggestion[] | undefined };
  const { data: recentReports } = useRecentReports() as unknown as { data: GeneratedReport[] | undefined };

  const _generate = useGenerateReport();
  const _saveTemplate = useSaveReportTemplate();
  const runTemplateMutation = useRunReportTemplate();

  const handleGenerateReport = () => {
    if (!naturalLanguageQuery.trim()) {
      toast({
        title: "Missing Query",
        description: "Please enter a report query in natural language.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    _generate.mutate(naturalLanguageQuery, {
      onSuccess: () => {
        toast({
          title: "Report Generated",
          description: "Your AI-powered report has been created successfully.",
        });
        setNaturalLanguageQuery("");
      },
      onError: (error: Error) =>
        toast({ title: "Generation Failed", description: error.message, variant: "destructive" }),
      onSettled: () => setIsGenerating(false),
    });
  };

  const handleSaveAsTemplate = () => {
    if (!naturalLanguageQuery.trim()) return;

    const templateName = prompt("Enter a name for this report template:");
    if (templateName) {
      _saveTemplate.mutate(
        {
          name: templateName,
          description: `Generated from: "${naturalLanguageQuery}"`,
          query: naturalLanguageQuery,
          isActive: true,
        } as Partial<ReportTemplate>,
        {
          onSuccess: () =>
            toast({ title: "Template Saved", description: "Report template has been saved for future use." }),
        },
      );
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "sales": return "bg-green-100 text-green-800";
      case "operations": return "bg-blue-100 text-blue-800";
      case "customers": return "bg-purple-100 text-purple-800";
      case "vendors": return "bg-orange-100 text-orange-800";
      case "finance": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
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

  return {
    naturalLanguageQuery,
    setNaturalLanguageQuery,
    selectedTemplate,
    setSelectedTemplate,
    isGenerating,
    templates,
    suggestions,
    recentReports,
    runTemplateMutation,
    handleGenerateReport,
    handleSaveAsTemplate,
    getCategoryColor,
    exampleQueries,
  };
}
