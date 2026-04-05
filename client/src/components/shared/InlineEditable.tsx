import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableBaseProps {
  isLocked?: boolean;
  isPending?: boolean;
  className?: string;
}

// ─── EditableText ───────────────────────────────────────────────

interface EditableTextProps extends EditableBaseProps {
  value: string;
  field: string;
  onSave: (fields: Record<string, any>) => void;
  label?: string;
  type?: "text" | "number";
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  emptyText?: string;
}

export function EditableText({
  value,
  field,
  onSave,
  label,
  type = "text",
  prefix,
  suffix,
  placeholder,
  emptyText = "Not set",
  isLocked,
  isPending,
  className,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Sync external value changes
  useEffect(() => {
    if (!editing) setEditValue(value);
  }, [value, editing]);

  const handleSave = useCallback(() => {
    setEditing(false);
    if (editValue !== value) {
      const saveValue = type === "number" ? (editValue || undefined) : (editValue || undefined);
      onSave({ [field]: saveValue });
    }
  }, [editValue, value, field, type, onSave]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setEditValue(value);
  }, [value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  }, [handleSave, handleCancel]);

  if (isLocked) {
    return (
      <span className={cn("text-sm", className)}>
        {prefix}{value || emptyText}{suffix}
      </span>
    );
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
        <Input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-7 text-sm"
          min={type === "number" ? "0" : undefined}
          step={type === "number" ? "0.01" : undefined}
        />
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
    );
  }

  return (
    <span
      className={cn(
        "group/edit inline-flex items-center gap-1.5 cursor-pointer hover:bg-gray-100 rounded px-1 -mx-1 transition-colors",
        className,
      )}
      onClick={() => setEditing(true)}
    >
      <span className={cn("text-sm", !value && "text-muted-foreground italic")}>
        {prefix}{value || emptyText}{suffix}
      </span>
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
      ) : (
        <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover/edit:opacity-100 transition-opacity" />
      )}
    </span>
  );
}

// ─── EditableDate ───────────────────────────────────────────────

interface EditableDateProps extends EditableBaseProps {
  value: string | Date | null | undefined;
  field: string;
  onSave: (fields: Record<string, any>) => void;
  emptyText?: string;
  renderExtra?: (value: string) => React.ReactNode;
}

export function EditableDate({
  value,
  field,
  onSave,
  emptyText = "Not set",
  renderExtra,
  isLocked,
  isPending,
  className,
}: EditableDateProps) {
  const [editing, setEditing] = useState(false);
  const toDateStr = (v: string | Date | null | undefined) => v ? new Date(v).toISOString().split("T")[0] : "";
  const dateStr = toDateStr(value);
  const [editValue, setEditValue] = useState(dateStr);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  useEffect(() => {
    if (!editing) {
      setEditValue(toDateStr(value));
    }
  }, [value, editing]);

  const handleSave = useCallback(() => {
    setEditing(false);
    const newDateStr = editValue || "";
    const oldDateStr = toDateStr(value);
    if (newDateStr !== oldDateStr) {
      onSave({ [field]: editValue ? new Date(editValue) : null });
    }
  }, [editValue, value, field, onSave]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setEditValue(toDateStr(value));
  }, [value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  }, [handleSave, handleCancel]);

  const formatDisplay = (v: string | Date | null | undefined): string => {
    if (!v) return emptyText;
    try {
      return new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return String(v);
    }
  };

  if (isLocked) {
    return (
      <span className={cn("text-sm inline-flex items-center gap-1.5", className)}>
        {formatDisplay(value)}
        {value && renderExtra?.(value as string)}
      </span>
    );
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          type="date"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-7 text-sm w-40"
        />
      </div>
    );
  }

  return (
    <span
      className={cn(
        "group/edit inline-flex items-center gap-1.5 cursor-pointer hover:bg-gray-100 rounded px-1 -mx-1 transition-colors",
        className,
      )}
      onClick={() => setEditing(true)}
    >
      <span className={cn("text-sm", !value && "text-muted-foreground italic")}>
        {formatDisplay(value)}
      </span>
      {value && renderExtra?.(value as string)}
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
      ) : (
        <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover/edit:opacity-100 transition-opacity" />
      )}
    </span>
  );
}

// ─── EditableSelect ─────────────────────────────────────────────

interface SelectOption {
  value: string;
  label: string;
}

interface EditableSelectProps extends EditableBaseProps {
  value: string;
  field: string;
  onSave: (fields: Record<string, any>) => void;
  options: SelectOption[];
  placeholder?: string;
  emptyOption?: string;
}

export function EditableSelect({
  value,
  field,
  onSave,
  options,
  placeholder = "Select...",
  emptyOption,
  isLocked,
  isPending,
  className,
}: EditableSelectProps) {
  const handleChange = (newValue: string) => {
    const resolved = newValue === "__empty__" ? "" : newValue;
    if (resolved !== value) {
      onSave({ [field]: resolved });
    }
  };

  const currentLabel = options.find((o) => o.value === value)?.label || value || emptyOption || placeholder;

  if (isLocked) {
    return <span className={cn("text-sm", className)}>{currentLabel}</span>;
  }

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <Select value={value || "__empty__"} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger className="h-7 text-sm border-dashed w-auto min-w-[100px]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {emptyOption && (
            <SelectItem value="__empty__" className="text-muted-foreground">{emptyOption}</SelectItem>
          )}
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isPending && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
    </div>
  );
}

// ─── EditableTextarea ───────────────────────────────────────────

interface EditableTextareaProps extends EditableBaseProps {
  value: string;
  field: string;
  onSave: (fields: Record<string, any>) => void;
  placeholder?: string;
  emptyText?: string;
  rows?: number;
}

export function EditableTextarea({
  value,
  field,
  onSave,
  placeholder = "Add notes...",
  emptyText = "No notes",
  rows = 3,
  isLocked,
  isPending,
  className,
}: EditableTextareaProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editValue.length, editValue.length);
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) setEditValue(value);
  }, [value, editing]);

  const handleSave = () => {
    setEditing(false);
    if (editValue !== value) {
      onSave({ [field]: editValue || null });
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditValue(value);
  };

  if (isLocked) {
    return (
      <p className={cn("text-sm whitespace-pre-wrap", !value && "text-muted-foreground italic", className)}>
        {value || emptyText}
      </p>
    );
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <Textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="text-sm"
        />
        <div className="flex gap-1.5 justify-end">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCancel}>
            <X className="w-3 h-3 mr-1" />Cancel
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group/edit cursor-pointer hover:bg-gray-100 rounded p-1.5 -m-1.5 transition-colors relative",
        className,
      )}
      onClick={() => setEditing(true)}
    >
      <p className={cn("text-sm whitespace-pre-wrap pr-5", !value && "text-muted-foreground italic")}>
        {value || emptyText}
      </p>
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground absolute top-2 right-2" />
      ) : (
        <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover/edit:opacity-100 transition-opacity absolute top-2 right-2" />
      )}
    </div>
  );
}
