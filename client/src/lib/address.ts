export function normalizeCountryCode(country: string): string {
  if (!country) return "US";
  const c = country.trim().toUpperCase();
  if (c === "US" || c === "CA" || c === "MX") return c;
  const mapping: Record<string, string> = {
    "USA": "US", "U.S.": "US", "U.S.A.": "US",
    "UNITED STATES": "US", "UNITED STATES OF AMERICA": "US",
    "CANADA": "CA", "CAN": "CA",
    "MEXICO": "MX", "MEX": "MX", "MÉXICO": "MX",
  };
  return mapping[c] || "US";
}
