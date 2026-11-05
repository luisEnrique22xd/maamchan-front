import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface SaleItem {
  product_name: string;
  quantity: number;
  subtotal: string;
}

interface Sale {
  id: number;
  customer_name?: string | null;
  sale_type: string;
  total_amount?: string;
  paid_amount?: string;
  balance_due?: string;
  created_at?: string;
  items?: SaleItem[];
}

export async function downloadTicketPDF(sale: Sale) {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '280px';
  container.style.fontFamily = 'Courier New, monospace';
  container.style.fontSize = '11px';
  container.style.padding = '12px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#000000';

  container.innerHTML = `
    <div style="text-align: center;">
      <h3 style="margin:0 0 4px 0; font-size: 14px;">MADAME CHANTAL</h3>
      <p style="margin:2px 0; font-size: 10px;">Red de Distribución de Fragancias</p>
      <p style="margin:2px 0; font-size: 10px;">Huamantla, Tlaxcala</p>
    </div>
    <div style="border-bottom: 1px dashed #000; margin: 8px 0;"></div>
    <p style="margin: 3px 0;"><strong>Folio Venta:</strong> #${sale.id}</p>
    <p style="margin: 3px 0;"><strong>Fecha:</strong> ${new Date(sale.created_at || Date.now()).toLocaleString()}</p>
    <p style="margin: 3px 0;"><strong>Cliente:</strong> ${sale.customer_name || 'General'}</p>
    <p style="margin: 3px 0;"><strong>Tipo:</strong> ${sale.sale_type}</p>
    <div style="border-bottom: 1px dashed #000; margin: 8px 0;"></div>
    <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
      <thead>
        <tr>
          <th style="text-align: left;">Cant / Prod</th>
          <th style="text-align: right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${sale.items?.map(item => `
          <tr>
            <td style="padding: 2px 0;">${item.quantity}x ${item.product_name}</td>
            <td style="text-align: right; padding: 2px 0;">$${item.subtotal}</td>
          </tr>
        `).join('') || ''}
      </tbody>
    </table>
    <div style="border-bottom: 1px dashed #000; margin: 8px 0;"></div>
    <div style="text-align: right; font-size: 11px;">
      <p style="margin: 2px 0;"><strong>Total: $${sale.total_amount}</strong></p>
      <p style="margin: 2px 0;">Pagado: $${sale.paid_amount || '0.00'}</p>
      <p style="margin: 2px 0;">Saldo Pendiente: $${sale.balance_due || '0.00'}</p>
    </div>
    <div style="border-bottom: 1px dashed #000; margin: 8px 0;"></div>
    <div style="text-align: center; font-size: 9px; margin-top: 10px;">
      <p style="margin: 2px 0;">¡Gracias por su preferencia!</p>
      <p style="margin: 2px 0;">Conserve este comprobante para cualquier aclaración.</p>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 160] 
    });

    const imgHeight = (canvas.height * 80) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, 80, imgHeight);
    pdf.save(`Ticket_Venta_${sale.id}.pdf`);
  } catch (err) {
    console.error('Error al generar el PDF del ticket:', err);
    throw err;
  } finally {
    document.body.removeChild(container);
  }
}