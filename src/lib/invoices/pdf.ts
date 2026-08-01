import PDFDocument from "pdfkit";

type LineItem = {
  description: string;
  quantity: number;
  unitPriceCents: number;
};

function cents(n: number) {
  return `$${(n / 100).toFixed(2)}`;
}

export function buildInvoicePdfBuffer(invoice: {
  invoiceNumber: string;
  issueDate: Date | string;
  dueDate?: Date | string | null;
  sellerLegalName?: string | null;
  sellerAddress?: string | null;
  sellerTaxId?: string | null;
  sellerPaymentInstructions?: string | null;
  sellerFooterNote?: string | null;
  clientName?: string | null;
  clientCompany?: string | null;
  clientEmail?: string | null;
  clientAddress?: string | null;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  notesPublic?: string | null;
  payUrl?: string | null;
  lineItems: LineItem[];
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "LETTER" });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.font("Helvetica-Bold").fontSize(20).text("INVOICE", { align: "right" });
    doc.font("Helvetica").fontSize(10).text(invoice.invoiceNumber, { align: "right" });
    doc.moveDown();

    doc.font("Helvetica-Bold").fontSize(12).text(invoice.sellerLegalName || "Ryan Tang");
    doc.font("Helvetica").fontSize(9);
    if (invoice.sellerAddress) doc.text(invoice.sellerAddress);
    if (invoice.sellerTaxId) doc.text(`Tax ID: ${invoice.sellerTaxId}`);

    doc.moveDown();
    doc.font("Helvetica-Bold").text("Bill to");
    doc.font("Helvetica");
    if (invoice.clientName) doc.text(invoice.clientName);
    if (invoice.clientCompany) doc.text(invoice.clientCompany);
    if (invoice.clientEmail) doc.text(invoice.clientEmail);
    if (invoice.clientAddress) doc.text(invoice.clientAddress);

    doc.moveDown();
    const issue = new Date(invoice.issueDate).toLocaleDateString();
    doc.text(`Issue date: ${issue}`);
    if (invoice.dueDate) {
      doc.text(`Due date: ${new Date(invoice.dueDate).toLocaleDateString()}`);
    }

    doc.moveDown();
    const startY = doc.y;
    doc.font("Helvetica-Bold");
    doc.text("Description", 50, startY, { width: 280 });
    doc.text("Qty", 340, startY, { width: 40 });
    doc.text("Rate", 390, startY, { width: 70 });
    doc.text("Amount", 470, startY, { width: 80, align: "right" });
    doc
      .moveTo(50, startY + 14)
      .lineTo(550, startY + 14)
      .stroke();

    let y = startY + 22;
    doc.font("Helvetica").fontSize(9);
    for (const item of invoice.lineItems) {
      const amount = item.quantity * item.unitPriceCents;
      doc.text(item.description, 50, y, { width: 280 });
      doc.text(String(item.quantity), 340, y, { width: 40 });
      doc.text(cents(item.unitPriceCents), 390, y, { width: 70 });
      doc.text(cents(amount), 470, y, { width: 80, align: "right" });
      y += 18;
    }

    doc.y = y + 10;
    doc.text(`Subtotal: ${cents(invoice.subtotalCents)}`, { align: "right" });
    if (invoice.discountCents) {
      doc.text(`Discount: -${cents(invoice.discountCents)}`, { align: "right" });
    }
    if (invoice.taxCents) {
      doc.text(`Tax: ${cents(invoice.taxCents)}`, { align: "right" });
    }
    doc.font("Helvetica-Bold").text(`Total: ${cents(invoice.totalCents)}`, { align: "right" });

    doc.moveDown();
    doc.font("Helvetica").fontSize(9);
    if (invoice.sellerPaymentInstructions) {
      doc.text("Payment instructions");
      doc.text(invoice.sellerPaymentInstructions);
    }
    if (invoice.payUrl) {
      doc.moveDown(0.5);
      doc.fillColor("#0066cc").text(`Pay online: ${invoice.payUrl}`, { link: invoice.payUrl });
      doc.fillColor("#000000");
    }
    if (invoice.notesPublic) {
      doc.moveDown();
      doc.text(invoice.notesPublic);
    }
    if (invoice.sellerFooterNote) {
      doc.moveDown();
      doc.fillColor("#666666").text(invoice.sellerFooterNote);
    }

    doc.end();
  });
}
