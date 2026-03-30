export const IMPRINT_LOCATIONS = [
  { value: "left_chest", label: "Left Chest" },
  { value: "right_chest", label: "Right Chest" },
  { value: "full_front", label: "Full Front" },
  { value: "full_back", label: "Full Back" },
  { value: "left_sleeve", label: "Left Sleeve" },
  { value: "right_sleeve", label: "Right Sleeve" },
  { value: "collar", label: "Collar / Nape" },
  { value: "cap_front", label: "Cap Front" },
  { value: "cap_back", label: "Cap Back" },
  { value: "front_panel", label: "Front Panel" },
  { value: "other", label: "Other" },
] as const;

export const IMPRINT_METHODS = [
  { value: "screen_print", label: "Screen Printing" },
  { value: "embroidery", label: "Embroidery" },
  { value: "heat_transfer", label: "Heat Transfer" },
  { value: "dtf", label: "Direct-to-Film (DTF)" },
  { value: "sublimation", label: "Sublimation" },
  { value: "laser_engraving", label: "Laser Engraving" },
  { value: "pad_print", label: "Pad Printing" },
  { value: "deboss", label: "Deboss / Emboss" },
  { value: "none", label: "No Decoration" },
] as const;

// Lookup helpers: convert snake_case values to display labels
export function getImprintMethodLabel(value: string | null | undefined): string {
  if (!value) return "";
  return IMPRINT_METHODS.find(m => m.value === value)?.label || value.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export function getImprintLocationLabel(value: string | null | undefined): string {
  if (!value) return "";
  return IMPRINT_LOCATIONS.find(l => l.value === value)?.label || value.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
