import PDFDocument from "pdfkit";

const PAGE_BOTTOM = 720;
const SIGNATURE_BLOCK_HEIGHT = 180;

export function buildAgreementPdfBuffer(args: {
  title: string;
  bodyText: string;
  signerName?: string;
  signerEmail?: string;
  signedAt?: string | Date;
  externalId?: string;
  signatureImageBuffer?: Buffer | null;
  typedSignatureText?: string | null;
}): Promise<Buffer> {
  const {
    title,
    bodyText,
    signerName,
    signerEmail,
    signedAt,
    externalId,
    signatureImageBuffer,
    typedSignatureText,
  } = args;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 54, size: "LETTER" });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    const left = 54;
    const right = doc.page.width - 54;
    const width = right - left;
    let y = 54;

    const heading = String(title || "Agreement").trim() || "Agreement";
    doc.font("Helvetica-Bold").fontSize(16).fillColor("#111111").text(heading, left, y, {
      width,
      align: "center",
    });
    y += doc.heightOfString(heading, { width, align: "center" }) + 24;

    doc.font("Helvetica").fontSize(10).fillColor("#333333");
    const paragraphs = String(bodyText || "")
      .replace(/\r\n/g, "\n")
      .split("\n");

    for (const paragraph of paragraphs) {
      const block = paragraph.trim() ? paragraph : " ";
      const h = doc.heightOfString(block, { width });
      if (y + h > PAGE_BOTTOM - SIGNATURE_BLOCK_HEIGHT) {
        doc.addPage();
        y = 54;
      }
      doc.text(block, left, y, { width, lineGap: 2 });
      y += h + 10;
    }

    if (y + SIGNATURE_BLOCK_HEIGHT > PAGE_BOTTOM) {
      doc.addPage();
      y = 54;
    } else {
      y += 16;
    }

    doc.moveTo(left, y).lineTo(right, y).strokeColor("#cccccc").lineWidth(0.5).stroke();
    y += 18;

    doc.font("Helvetica-Bold").fontSize(11).fillColor("#111111").text("Signature", left, y);
    y += 18;

    doc.font("Helvetica").fontSize(10).fillColor("#333333");
    if (signerName) {
      doc.text(`Name: ${signerName}`, left, y, { width });
      y += 16;
    }
    if (signerEmail) {
      doc.text(`Email: ${signerEmail}`, left, y, { width });
      y += 16;
    }

    const signedDate = signedAt ? new Date(signedAt) : new Date();
    const dateLabel =
      Number.isNaN(signedDate.getTime())
        ? String(signedAt || "")
        : `${signedDate.toLocaleString("en-US", {
            dateStyle: "long",
            timeStyle: "short",
            timeZone: "UTC",
          })} UTC`;
    if (dateLabel) {
      doc.text(`Date: ${dateLabel}`, left, y, { width });
      y += 16;
    }

    y += 6;
    if (signatureImageBuffer && signatureImageBuffer.length > 0) {
      try {
        doc.image(signatureImageBuffer, left, y, { fit: [220, 70] });
        y += 80;
      } catch {
        // ignore bad image
      }
    } else if (typedSignatureText) {
      doc.font("Helvetica-Oblique").fontSize(18).text(typedSignatureText, left, y, { width: 300 });
      y += 28;
    }

    if (externalId) {
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#888888")
        .text(`Reference: ${externalId}`, left, Math.min(y + 12, PAGE_BOTTOM));
    }

    doc.end();
  });
}
