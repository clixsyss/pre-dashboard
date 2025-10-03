import jsPDF from 'jspdf';

class InvoiceService {
  generateInvoicePDF(invoiceData, requestData, projectData) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Colors
    const primaryColor = '#AF1E23';
    const secondaryColor = '#6B7280';
    const lightGray = '#F3F4F6';
    
    // Header
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Company Logo/Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(projectData?.name || 'PRE Management', 20, 25);
    
    // Invoice Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('INVOICE', pageWidth - 60, 25);
    
    // Invoice Number and Date
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${invoiceData.id}`, pageWidth - 60, 50);
    doc.text(`Date: ${new Date(invoiceData.createdAt?.toDate ? invoiceData.createdAt.toDate() : invoiceData.createdAt).toLocaleDateString()}`, pageWidth - 60, 55);
    
    // Client Information
    doc.setFillColor(lightGray);
    doc.rect(20, 70, pageWidth - 40, 40, 'F');
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 25, 80);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(requestData?.userName || 'N/A', 25, 90);
    doc.text(requestData?.userEmail || 'N/A', 25, 95);
    doc.text(requestData?.userPhone || requestData?.userMobile || 'N/A', 25, 100);
    
    // Request Information
    doc.text('Request Details:', 25, 110);
    doc.text(`Category: ${requestData?.categoryName || 'N/A'}`, 25, 115);
    doc.text(`Status: ${requestData?.status || 'N/A'}`, 25, 120);
    
    // Invoice Items Table
    const tableTop = 130;
    const tableWidth = pageWidth - 40;
    const colWidths = [100, 40, 40];
    
    // Table Header
    doc.setFillColor(primaryColor);
    doc.rect(20, tableTop, tableWidth, 15, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 25, tableTop + 10);
    doc.text('Qty', 125, tableTop + 10);
    doc.text('Amount', 165, tableTop + 10);
    
    // Table Row
    doc.setFillColor(255, 255, 255);
    doc.rect(20, tableTop + 15, tableWidth, 15, 'F');
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceData.description, 25, tableTop + 25);
    doc.text('1', 125, tableTop + 25);
    doc.text(`${invoiceData.price} ${invoiceData.currency}`, 165, tableTop + 25);
    
    // Total
    const totalY = tableTop + 40;
    doc.setFillColor(lightGray);
    doc.rect(20, totalY, tableWidth, 15, 'F');
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 125, totalY + 10);
    doc.text(`${invoiceData.price} ${invoiceData.currency}`, 165, totalY + 10);
    
    // Payment Information
    const paymentY = totalY + 30;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Payment Information:', 20, paymentY);
    doc.text('Please contact the management office for payment details.', 20, paymentY + 5);
    doc.text('Payment is due within 30 days of invoice date.', 20, paymentY + 10);
    
    // Footer
    const footerY = pageHeight - 30;
    doc.setFillColor(lightGray);
    doc.rect(0, footerY, pageWidth, 30, 'F');
    
    doc.setTextColor(secondaryColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your business!', 20, footerY + 10);
    doc.text('For questions about this invoice, please contact the management office.', 20, footerY + 15);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 20, footerY + 20);
    
    return doc;
  }
  
  downloadInvoice(invoiceData, requestData, projectData) {
    const doc = this.generateInvoicePDF(invoiceData, requestData, projectData);
    const fileName = `Invoice_${invoiceData.id}_${requestData?.userName || 'Unknown'}.pdf`;
    doc.save(fileName);
  }
  
  openInvoiceInNewTab(invoiceData, requestData, projectData) {
    const doc = this.generateInvoicePDF(invoiceData, requestData, projectData);
    const pdfDataUri = doc.output('datauristring');
    window.open(pdfDataUri, '_blank');
  }
}

export default new InvoiceService();
