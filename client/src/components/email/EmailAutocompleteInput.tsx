import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface EmailSuggestion {
  email: string;
  name: string;
  source: string;
}

interface EmailAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiple?: boolean; // default true — false for single email with autocomplete
}

export default function EmailAutocompleteInput({ value, onChange, placeholder = "Type to search...", className, multiple = true }: EmailAutocompleteInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // For single mode, sync inputValue from value prop
  useEffect(() => {
    if (!multiple) setInputValue(value || "");
  }, [multiple, value]);

  const emails = multiple ? (value ? value.split(",").map(e => e.trim()).filter(Boolean) : []) : [];

  // Fetch all available emails
  const { data: contacts = [] } = useQuery<any[]>({ queryKey: ["/api/contacts"] });
  const { data: suppliers = [] } = useQuery<any[]>({ queryKey: ["/api/suppliers"] });
  const { data: teamMembers = [] } = useQuery<any[]>({ queryKey: ["/api/users/team"] });

  // Build deduplicated suggestions
  const seenEmails = new Set<string>();
  const allSuggestions: EmailSuggestion[] = [];
  const addIfNew = (email: string, name: string, source: string) => {
    const lower = email.toLowerCase();
    if (!seenEmails.has(lower)) {
      seenEmails.add(lower);
      allSuggestions.push({ email, name, source });
    }
  };
  contacts.forEach((c: any) => { if (c.email) addIfNew(c.email, `${c.firstName || ""} ${c.lastName || ""}`.trim(), "contact"); });
  suppliers.forEach((s: any) => { if (s.email) addIfNew(s.email, s.name || "", "supplier"); });
  teamMembers.forEach((u: any) => { if (u.email) addIfNew(u.email, `${u.firstName || ""} ${u.lastName || ""}`.trim(), "team"); });

  const filtered = inputValue.length >= 1
    ? allSuggestions.filter(s =>
        !emails.includes(s.email) &&
        (s.email.toLowerCase().includes(inputValue.toLowerCase()) ||
         s.name.toLowerCase().includes(inputValue.toLowerCase()))
      ).slice(0, 8)
    : [];

  const selectEmail = (email: string) => {
    const trimmed = email.trim();
    if (!trimmed) return;
    if (multiple) {
      if (emails.includes(trimmed)) return;
      onChange([...emails, trimmed].join(", "));
      setInputValue("");
    } else {
      onChange(trimmed);
      setInputValue(trimmed);
    }
    setShowSuggestions(false);
    setHighlightIndex(-1);
  };

  const removeEmail = (email: string) => {
    if (multiple) {
      onChange(emails.filter(e => e !== email).join(", "));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Tab" || (e.key === "," && multiple)) {
      e.preventDefault();
      if (highlightIndex >= 0 && filtered[highlightIndex]) {
        selectEmail(filtered[highlightIndex].email);
      } else if (inputValue.includes("@")) {
        selectEmail(inputValue);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Backspace" && !inputValue && multiple && emails.length > 0) {
      removeEmail(emails[emails.length - 1]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const sourceColor: Record<string, string> = {
    contact: "bg-blue-100 text-blue-700",
    supplier: "bg-purple-100 text-purple-700",
    team: "bg-green-100 text-green-700",
  };

  return (
    <div ref={containerRef} className="relative">
      <div className={`flex flex-wrap gap-1 items-center border rounded-md px-2 py-1 min-h-[32px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 bg-background ${className || ""}`}>
        {multiple && emails.map(email => (
          <Badge key={email} variant="secondary" className="text-[10px] gap-1 h-5 px-1.5">
            {email}
            <X className="w-2.5 h-2.5 cursor-pointer hover:text-red-500" onClick={() => removeEmail(email)} />
          </Badge>
        ))}
        <input
          value={inputValue}
          onChange={(e) => {
            const v = e.target.value;
            setInputValue(v);
            setShowSuggestions(true);
            setHighlightIndex(-1);
            // For single mode, also update parent on every keystroke
            if (!multiple) onChange(v);
          }}
          onFocus={() => inputValue.length >= 1 && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={multiple && emails.length > 0 ? "" : placeholder}
          className="flex-1 min-w-[120px] outline-none text-sm bg-transparent py-0.5"
        />
      </div>

      {showSuggestions && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((s, i) => (
            <button
              key={`${s.email}-${i}`}
              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-50 ${i === highlightIndex ? "bg-gray-100" : ""}`}
              onMouseDown={(e) => { e.preventDefault(); selectEmail(s.email); }}
            >
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{s.name || s.email}</p>
                {s.name && <p className="text-[10px] text-gray-400 truncate">{s.email}</p>}
              </div>
              <Badge className={`text-[9px] ml-2 flex-shrink-0 ${sourceColor[s.source] || ""}`}>{s.source}</Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
