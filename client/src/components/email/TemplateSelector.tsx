import { useEffect, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText } from "lucide-react";
import { useEmailTemplates, applyTemplate, type EmailTemplate } from "@/hooks/useEmailTemplates";

interface TemplateSelectorProps {
  templateType: string;
  mergeData: Record<string, string>;
  onApply: (applied: { subject: string; body: string } | null) => void;
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
}

export default function TemplateSelector({
  templateType,
  mergeData,
  onApply,
  selectedId,
  onSelectId,
}: TemplateSelectorProps) {
  const { data: templates = [] } = useEmailTemplates(templateType);
  const autoApplied = useRef(false);

  const activeTemplates = templates.filter((t) => t.isActive !== false);

  // Reset auto-apply flag when selectedId is cleared (dialog reopened)
  useEffect(() => {
    if (selectedId === null) {
      autoApplied.current = false;
    }
  }, [selectedId]);

  // Auto-apply default template on first load
  useEffect(() => {
    if (autoApplied.current || selectedId || activeTemplates.length === 0) return;
    const defaultTpl = activeTemplates.find((t) => t.isDefault);
    if (defaultTpl) {
      autoApplied.current = true;
      onSelectId(defaultTpl.id);
      onApply(applyTemplate(defaultTpl, mergeData));
    }
  }, [activeTemplates, selectedId, mergeData, onApply, onSelectId]);

  if (activeTemplates.length === 0) return null;

  const handleChange = (value: string) => {
    if (value === "__none__") {
      onSelectId(null);
      onApply(null);
      return;
    }
    onSelectId(value);
    const template = activeTemplates.find((t) => t.id === value);
    if (template) {
      onApply(applyTemplate(template, mergeData));
    }
  };

  return (
    <div className="flex items-center gap-2 mb-3">
      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <Select value={selectedId || "__none__"} onValueChange={handleChange}>
        <SelectTrigger className="h-8 text-sm w-[280px]">
          <SelectValue placeholder="Select template..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">No template (custom)</SelectItem>
          {activeTemplates.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}{t.isDefault ? " (Default)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
