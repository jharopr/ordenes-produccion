import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ProductionOrder } from '../production-orders/production-order.entity';

@Injectable()
export class PdfService {
  createOrderPdf(order: ProductionOrder) {
    const doc = new PDFDocument({ size: 'A4', margin: 42, bufferPages: true });
    const currency = (value: string) => `S/ ${Number(value).toFixed(2)}`;

    doc.rect(36, 36, 523, 760).lineWidth(1.5).stroke('#1f2937');

    const logoFile = order.customer.logoPath
      ? join(process.cwd(), 'apps', 'backend', order.customer.logoPath.replace(/^\/+/, ''))
      : null;
    if (logoFile && existsSync(logoFile)) {
      doc.image(logoFile, 50, 48, { fit: [180, 50], valign: 'center' });
    } else {
      doc.fillColor('#b91c1c').fontSize(22).font('Helvetica-Bold').text('SALABUS', 50, 52);
    }

    doc.fillColor('#111827').fontSize(16).font('Helvetica-Bold')
      .text('ORDEN DE PRODUCCIÓN', 270, 52, { align: 'right' });
    doc.fontSize(12).text(order.orderNumber, 300, 78, { align: 'right' });
    doc.moveTo(42, 112).lineTo(553, 112).stroke('#1f2937');

    // Datos del cliente: el nombre aparece directamente, sin la etiqueta "Cliente".
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(10)
      .text(order.customer.businessName, 50, 123, { width: 235 });
    let customerY = 140;
    const customerLines = [
      order.customer.taxId ? `RUC: ${order.customer.taxId}` : null,
      order.customer.address,
      order.customer.city,
      order.customer.phone ? `Teléfono: ${order.customer.phone}` : null,
      order.customer.email ? `Correo: ${order.customer.email}` : null,
      order.customer.contactName ? `Contacto: ${order.customer.contactName}` : null,
    ].filter((value): value is string => Boolean(value));

    doc.font('Helvetica').fontSize(8.5);
    for (const line of customerLines) {
      doc.text(line, 50, customerY, { width: 235 });
      customerY += doc.heightOfString(line, { width: 235 }) + 3;
    }

    // Datos de la orden en la columna derecha. El estado no se imprime.
    doc.font('Helvetica-Bold').fontSize(11).text(order.title, 310, 123, {
      width: 235,
      align: 'center',
    });
    doc.fontSize(7).fillColor('#6b7280')
      .text('SEDE', 310, 153, { width: 105 })
      .text('FECHA DE INICIO', 310, 173, { width: 105 })
      .text('FECHA DE TERMINACIÓN', 310, 193, { width: 105 });
    doc.fillColor('#111827').font('Helvetica').fontSize(8.5)
      .text(order.location?.name ?? '—', 415, 153, { width: 130, align: 'right' })
      .text(order.startDate ?? '—', 415, 173, { width: 130, align: 'right' })
      .text(
        order.completionDate ?? order.estimatedCompletionDate ?? '—',
        415,
        193,
        { width: 130, align: 'right' },
      );

    doc.moveTo(42, 218).lineTo(553, 218).stroke('#1f2937');
    const columns = [50, 340, 400, 470];
    doc.font('Helvetica-Bold').fontSize(8)
      .text('DESCRIPCIÓN', columns[0], 230)
      .text('CANT.', columns[1], 230, { width: 45, align: 'right' })
      .text('P. UNIT.', columns[2], 230, { width: 60, align: 'right' })
      .text('SUBTOTAL', columns[3], 230, { width: 70, align: 'right' });

    let y = 252;
    for (const item of order.items) {
      if (y > 650) {
        doc.addPage();
        y = 50;
      }
      doc.font('Helvetica').fontSize(9).text(item.description, columns[0], y, { width: 275 });
      doc.text(item.quantity, columns[1], y, { width: 45, align: 'right' });
      doc.text(currency(item.unitPrice), columns[2], y, { width: 60, align: 'right' });
      doc.text(currency(item.subtotal), columns[3], y, { width: 70, align: 'right' });
      y += Math.max(24, doc.heightOfString(item.description, { width: 275 }) + 8);
    }

    y = Math.max(y + 15, 500);
    doc.moveTo(340, y).lineTo(550, y).stroke('#d1d5db');
    doc.font('Helvetica').fontSize(10)
      .text('Subtotal', 360, y + 12)
      .text(currency(order.subtotal), 460, y + 12, { width: 85, align: 'right' });
    doc.text('Descuento', 360, y + 30)
      .text(currency(order.discount), 460, y + 30, { width: 85, align: 'right' });
    doc.font('Helvetica-Bold').fontSize(14)
      .text('TOTAL', 360, y + 52)
      .text(currency(order.total), 450, y + 52, { width: 95, align: 'right' });

    doc.font('Helvetica-Bold').fontSize(9).text('OBSERVACIONES', 50, y + 95);
    doc.font('Helvetica').text(order.notes ?? 'Sin observaciones.', 50, y + 110, { width: 490 });
    doc.moveTo(75, 740).lineTo(230, 740).moveTo(360, 740).lineTo(515, 740).stroke('#111827');
    doc.fontSize(8)
      .text('SOLICITADO POR', 75, 746, { width: 155, align: 'center' })
      .text('FIRMA Y SELLO', 360, 746, { width: 155, align: 'center' });
    doc.end();
    return doc;
  }
}
