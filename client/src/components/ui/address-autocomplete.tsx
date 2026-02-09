import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin, Loader2 } from "lucide-react";

export interface AddressSuggestion {
  id: string;
  fullAddress: string;
  streetAddress: string;
  city: string;
  state: string;
  stateCode: string;
  zipCode: string;
  country: string;
}

export interface ParsedAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (address: ParsedAddress) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Start typing an address...",
  disabled = false,
  className,
  id,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const skipNextSearch = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    if (!isConfigured || disabled || !value || value.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/geocode/search?q=${encodeURIComponent(value)}`,
          { credentials: "include" }
        );
        if (!res.ok) {
          setIsLoading(false);
          return;
        }
        const data = await res.json();

        if (data.configured === false) {
          setIsConfigured(false);
          setIsLoading(false);
          return;
        }

        const results = data.suggestions || [];
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch {
        // Silently fail - input continues working normally
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      setIsLoading(false);
    };
  }, [value, isConfigured, disabled]);

  const handleSelect = useCallback(
    (suggestion: AddressSuggestion) => {
      skipNextSearch.current = true;
      onChange(suggestion.streetAddress);
      onAddressSelect({
        street: suggestion.streetAddress,
        city: suggestion.city,
        state: suggestion.stateCode || suggestion.state,
        zipCode: suggestion.zipCode,
        country: suggestion.country,
      });
      setIsOpen(false);
      setSuggestions([]);
    },
    [onChange, onAddressSelect]
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Input
            ref={inputRef}
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
            autoComplete="off"
            onBlur={() => {
              // Delay closing to allow click on suggestions
              setTimeout(() => setIsOpen(false), 200);
            }}
            onFocus={() => {
              if (suggestions.length > 0) {
                setIsOpen(true);
              }
            }}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[var(--radix-popover-trigger-width)]"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <ul className="max-h-64 overflow-auto py-1">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.id}
              className="flex items-start gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(suggestion);
              }}
            >
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <span className="leading-tight">{suggestion.fullAddress}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
