import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { FilterState } from "../types";
import { ALL_ENTITY_TYPES, ENTITY_TYPE_LABELS, STAGE_OPTIONS } from "../types";
import type { EntityType } from "@/services/search/requests";

interface SearchFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export function SearchFilters({ filters, onChange }: SearchFiltersProps) {
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleEntityType = (type: EntityType) => {
    const current = filters.entityTypes;
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    updateFilter("entityTypes", next);
  };

  const hasActiveFilters =
    filters.entityTypes.length > 0 ||
    filters.stage ||
    filters.marginMin ||
    filters.marginMax ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.industry;

  const clearFilters = () => {
    onChange({
      entityTypes: [],
      stage: "",
      marginMin: "",
      marginMax: "",
      dateFrom: "",
      dateTo: "",
      industry: "",
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-gray-500 gap-1 h-auto p-1">
            <X className="h-3 w-3" /> Clear
          </Button>
        )}
      </div>

      {/* Entity Types */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-600">Entity Types</Label>
        <div className="space-y-1.5">
          {ALL_ENTITY_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.entityTypes.includes(type)}
                onCheckedChange={() => toggleEntityType(type)}
              />
              <span className="text-sm text-gray-700">{ENTITY_TYPE_LABELS[type]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Stage */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-600">Stage</Label>
        <Select value={filters.stage} onValueChange={(v) => updateFilter("stage", v === "all" ? "" : v)}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>
          <SelectContent>
            {STAGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value || "all"} value={opt.value || "all"}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Margin Range */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-600">Margin %</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.marginMin}
            onChange={(e) => updateFilter("marginMin", e.target.value)}
            className="h-8 text-sm"
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.marginMax}
            onChange={(e) => updateFilter("marginMax", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Date Range */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-600">Date Range</Label>
        <div className="space-y-1.5">
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilter("dateFrom", e.target.value)}
            className="h-8 text-sm"
          />
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => updateFilter("dateTo", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Industry */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-600">Industry</Label>
        <Input
          placeholder="e.g. Technology"
          value={filters.industry}
          onChange={(e) => updateFilter("industry", e.target.value)}
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
}
