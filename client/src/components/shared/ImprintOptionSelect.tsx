import { useEffect, useMemo, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  useImprintOptions,
  useSubmitImprintSuggestion,
  type ImprintOptionType,
} from "@/services/imprint-options";
import { Loader2, Sparkles } from "lucide-react";

interface Props {
  type: ImprintOptionType;
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  orderId?: string;
  triggerClassName?: string;
  allowNone?: boolean;
}

const OTHER = "__other__";

/**
 * Dropdown for imprint location or method backed by admin-managed options.
 *
 * When the user picks "Other", a free-text input appears. The custom value is
 * persisted verbatim on the parent record. An optional checkbox lets the user
 * suggest the custom value to admins — on checkbox toggle or on blur/Enter,
 * the suggestion is submitted to the review queue.
 */
export function ImprintOptionSelect({
  type,
  value,
  onChange,
  placeholder,
  disabled,
  orderId,
  triggerClassName,
  allowNone,
}: Props) {
  const { data: options = [], isLoading } = useImprintOptions(type);
  const submitSuggestion = useSubmitImprintSuggestion();
  const { toast } = useToast();

  const knownValues = useMemo(() => new Set(options.map((o) => o.value)), [options]);
  const isCustom = !!value && !knownValues.has(value);

  const [mode, setMode] = useState<"known" | "other">(isCustom ? "other" : "known");
  const [customLabel, setCustomLabel] = useState<string>(isCustom ? prettify(value!) : "");
  const [suggest, setSuggest] = useState(false);
  // Track which labels have already been submitted from this component instance
  // to avoid double-submits when blur + checkbox fire back-to-back.
  const submittedLabelsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!value) {
      setMode("known");
      setCustomLabel("");
      return;
    }
    if (knownValues.has(value)) {
      setMode("known");
    } else {
      setMode("other");
      setCustomLabel(prettify(value));
    }
  }, [value, knownValues]);

  const handleSelectChange = (next: string) => {
    if (next === OTHER) {
      setMode("other");
      return;
    }
    setMode("known");
    setSuggest(false);
    setCustomLabel("");
    onChange(next);
  };

  const commitCustomValue = () => {
    const trimmed = customLabel.trim();
    if (!trimmed) return;
    const slug = toSlug(trimmed);
    if (slug !== value) onChange(slug);
  };

  const submitIfNeeded = async (force = false) => {
    const trimmed = customLabel.trim();
    if (!trimmed) return;
    if (!force && !suggest) return;
    const key = trimmed.toLowerCase();
    if (submittedLabelsRef.current.has(key)) return;
    submittedLabelsRef.current.add(key);

    try {
      const result = await submitSuggestion.mutateAsync({
        type,
        label: trimmed,
        suggestedFromOrderId: orderId,
      });
      if (result.duplicate && result.reason === "already_option") {
        toast({
          title: "Already available",
          description: `"${result.existingOption?.label ?? trimmed}" already exists as a ${type}. No suggestion needed.`,
        });
      } else if (result.duplicate) {
        toast({
          title: "Already suggested",
          description: "This label is already in the admin review queue.",
        });
      } else {
        toast({
          title: "Suggestion sent to admin",
          description:
            "An admin will review this and decide whether to add it to the global list.",
        });
      }
    } catch (err: any) {
      submittedLabelsRef.current.delete(key);
      toast({
        title: "Could not submit suggestion",
        description: err?.message ?? "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleCustomBlur = () => {
    commitCustomValue();
    void submitIfNeeded();
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitCustomValue();
      void submitIfNeeded();
    }
  };

  const handleSuggestToggle = (checked: boolean) => {
    setSuggest(checked);
    if (checked) {
      // Fire immediately so it doesn't depend on later blur.
      // Pass force=true because React hasn't flushed `suggest` state yet.
      commitCustomValue();
      void submitIfNeeded(true);
    }
  };

  const selectValue = mode === "other" ? OTHER : value ?? undefined;
  const trimmedLabel = customLabel.trim().toLowerCase();
  const alreadySubmitted = !!trimmedLabel && submittedLabelsRef.current.has(trimmedLabel);

  return (
    <div className="space-y-2">
      <Select
        value={selectValue}
        onValueChange={handleSelectChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className={triggerClassName}>
          <SelectValue
            placeholder={
              isLoading ? (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading…
                </span>
              ) : (
                placeholder ?? (type === "location" ? "Select location" : "Select method")
              )
            }
          />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.id} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
          {allowNone && !options.some((o) => o.value === "none") && (
            <SelectItem value="none">No Decoration</SelectItem>
          )}
          <SelectItem value={OTHER}>Other…</SelectItem>
        </SelectContent>
      </Select>

      {mode === "other" && (
        <div className="space-y-2 rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 p-2">
          <Label className="text-xs text-muted-foreground">
            Custom {type === "location" ? "location" : "method"}
          </Label>
          <Input
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            onBlur={handleCustomBlur}
            onKeyDown={handleCustomKeyDown}
            placeholder={
              type === "location"
                ? "e.g., Inside Hem, Hood Back"
                : "e.g., Glow-in-the-dark Ink"
            }
            disabled={disabled}
          />
          <div className="flex items-start gap-2">
            <Checkbox
              id={`suggest-${type}-${orderId ?? "global"}`}
              checked={suggest}
              disabled={disabled || !customLabel.trim()}
              onCheckedChange={(checked) => handleSuggestToggle(checked === true)}
            />
            <Label
              htmlFor={`suggest-${type}-${orderId ?? "global"}`}
              className="text-xs leading-snug cursor-pointer flex items-start gap-1"
            >
              <Sparkles className="w-3 h-3 mt-0.5 text-amber-500" />
              <span>
                Would you like to suggest this {type} to admin so it can be used in
                future projects?
                {alreadySubmitted && (
                  <span className="block text-emerald-600">✓ Suggestion submitted</span>
                )}
              </span>
            </Label>
          </div>
        </div>
      )}
    </div>
  );
}

function prettify(slug: string) {
  return slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function toSlug(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
