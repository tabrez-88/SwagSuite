import { vendorInvoiceRepository } from "../repositories/vendorInvoice.repository";
import { db } from "../db";

export class VendorInvoiceService {
  async getByOrderId(orderId: string) {
    return vendorInvoiceRepository.getVendorInvoicesByOrderId(orderId);
  }

  async create(orderId: string, data: {
    supplierId?: string;
    documentId?: string | null;
    invoiceNumber?: string;
    amount?: string;
    dueDate?: string;
    notes?: string;
  }) {
    const invoice = await vendorInvoiceRepository.createVendorInvoice({
      orderId,
      supplierId: data.supplierId,
      documentId: data.documentId || null,
      invoiceNumber: data.invoiceNumber || "",
      amount: data.amount || "0",
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      notes: data.notes,
    });

    // ── Bill → PO "Billed" Auto-Transition ──
    // When a vendor bill is created and linked to a PO document, auto-transition the PO to "billed"
    if (data.documentId) {
      try {
        const { generatedDocuments } = await import("@shared/schema");
        const { eq } = await import("drizzle-orm");

        const [poDoc] = await db
          .select()
          .from(generatedDocuments)
          .where(eq(generatedDocuments.id, data.documentId));

        if (poDoc && poDoc.documentType === 'purchase_order') {
          const currentMeta = typeof poDoc.metadata === 'string' ? JSON.parse(poDoc.metadata) : (poDoc.metadata || {});
          const currentStage = currentMeta.poStage || 'created';

          // Only auto-transition if PO is at ready_for_billing stage
          if (currentStage === 'ready_for_billing') {
            await db
              .update(generatedDocuments)
              .set({
                metadata: { ...currentMeta, poStage: 'billed' },
                updatedAt: new Date(),
              })
              .where(eq(generatedDocuments.id, data.documentId));

            // Log activity
            const { projectActivities } = await import("@shared/schema");
            await db.insert(projectActivities).values({
              orderId,
              userId: 'system',
              activityType: 'system_action',
              content: `PO #${poDoc.documentNumber || data.documentId} auto-transitioned to "Billed" — vendor bill #${data.invoiceNumber} recorded`,
              metadata: {
                action: 'bill_po_vouching',
                documentId: data.documentId,
                invoiceNumber: data.invoiceNumber,
              },
              isSystemGenerated: true,
            } as any);

            console.log(`[Bill→PO Auto] PO ${data.documentId} → billed (bill #${data.invoiceNumber})`);
          }
        }
      } catch (autoErr) {
        console.error('[Bill→PO Auto] Error:', autoErr);
      }
    }

    return invoice;
  }

  async update(id: string, data: {
    invoiceNumber?: string;
    amount?: string;
    dueDate?: string | null;
    notes?: string | null;
    status?: string;
  }) {
    const updateData: Record<string, unknown> = {};
    if (data.invoiceNumber !== undefined) updateData.invoiceNumber = data.invoiceNumber;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;

    return vendorInvoiceRepository.updateVendorInvoice(id, updateData as any);
  }
}

export const vendorInvoiceService = new VendorInvoiceService();
