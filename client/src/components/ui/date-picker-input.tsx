import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { parseLocalDate } from "@/lib/dateUtils";

interface DatePickerInputProps {
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Drop-in replacement for <Input type="date">.
 * Shows a button with formatted date that opens a calendar popover.
 *
 * Usage:
 *   <DatePickerInput value={dateStr} onChange={(v) => setDate(v)} />
 *
 * value/onChange use YYYY-MM-DD strings, same as native date inputs.
 */
export function DatePickerInput({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
}: DatePickerInputProps) {
  const [open, setOpen] = React.useState(false);
  const parsed = value ? parseLocalDate(value) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {parsed ? format(parsed, "MMM d, yyyy") : <span>{placeholder}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={parsed ?? undefined}
          onSelect={(date) => {
            if (date) {
              const y = date.getFullYear();
              const m = String(date.getMonth() + 1).padStart(2, "0");
              const d = String(date.getDate()).padStart(2, "0");
              onChange(`${y}-${m}-${d}`);
            } else {
              onChange("");
            }
            setOpen(false);
          }}
          defaultMonth={parsed ?? undefined}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
