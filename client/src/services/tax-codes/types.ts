/**
 * Tax code row from `/api/tax-codes`. The server returns a `label` used by
 * form selects; it may also carry `code`/`description` depending on the
 * source. `rate` is numeric in the UI contract.
 */
export interface TaxCode {
  id: string | number;
  label: string;
  /** The server stores rate as a decimal string but some forms edit it as number. */
  rate?: number | string;
  code?: string;
  description?: string | null;
  isActive?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}
