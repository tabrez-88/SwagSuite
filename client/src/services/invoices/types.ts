export interface ManualPaymentInput {
  amount: string;
  method: string;
  reference?: string;
  notes?: string;
  paidAt?: string;
}
