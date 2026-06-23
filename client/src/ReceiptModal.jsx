import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ReceiptModal = ({ payment, isOpen, onClose }) => {
  const receiptRef = useRef();

  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt</title>
        <style>
          body { font-family: 'Courier New', monospace; padding: 20px; background: #f5f5f5; }
          .receipt { background: white; padding: 30px; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { margin: 0; font-size: 24px; color: #2563eb; }
          .header p { margin: 5px 0; color: #666; font-size: 12px; }
          .receipt-number { background: #f0f0f0; padding: 15px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .receipt-number label { color: #666; font-weight: bold; }
          .section { margin: 20px 0; }
          .section-title { font-weight: bold; border-bottom: 2px solid #2563eb; padding-bottom: 5px; margin-bottom: 10px; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dotted #ddd; }
          .row.total { font-weight: bold; border-bottom: 2px solid #000; padding: 12px 0; font-size: 16px; }
          .row label { color: #666; }
          .status { text-align: center; margin: 20px 0; padding: 15px; background: #d1fae5; color: #065f46; border-radius: 4px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #999; }
          @media print { body { background: white; } .receipt { border: none; } }
        </style>
      </head>
      <body>
        ${receiptRef.current.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const element = receiptRef.current;
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`receipt-${payment.receiptNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF');
    }
  };

  const student = payment.invoice.student;
  const invoice = payment.invoice;
  const term = payment.invoice.term;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
          <div style={styles.buttonGroup}>
            <button onClick={handlePrint} style={styles.actionBtn}>
              🖨️ Print Receipt
            </button>
            <button onClick={handleDownloadPDF} style={styles.actionBtn}>
              📥 Download PDF
            </button>
          </div>
        </div>

        <div ref={receiptRef} style={styles.receipt}>
          {/* Header with Logo */}
          <div style={styles.receiptHeader}>
            <div style={styles.receiptLogoContainer}>
              <img src="/school-logo.png" alt="School Logo" style={styles.receiptLogo} />
              <div style={styles.receiptHeaderText}>
                <h1 style={styles.schoolName}>Albayyan International School</h1>
                <p style={styles.schoolSubtitle}>Fee Management System</p>
                <p style={styles.schoolAddress}>Payment Receipt</p>
              </div>
            </div>
          </div>

          {/* Receipt Number */}
          <div style={styles.receiptNumberBox}>
            <div style={styles.receiptNumberLabel}>Receipt #</div>
            <div style={styles.receiptNumberValue}>{payment.receiptNumber}</div>
          </div>

          {/* Student Details */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>📋 Student Details</div>
            <div style={styles.row}>
              <span style={styles.label}>Student Name:</span>
              <span style={styles.value}>{student.firstName} {student.lastName}</span>
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Admission #:</span>
              <span style={styles.value}>{student.admissionNumber}</span>
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Class:</span>
              <span style={styles.value}>{student.classLevel}</span>
            </div>
          </div>

          {/* Invoice Details */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>📄 Invoice Details</div>
            <div style={styles.row}>
              <span style={styles.label}>Term:</span>
              <span style={styles.value}>{term?.name || 'N/A'}</span>
            </div>
            <div style={styles.row}>
              <span style={styles.label}>📊 Expected Amount:</span>
              <span style={styles.valueBold}>₦{invoice.totalAmount.toLocaleString()}</span>
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Previously Paid:</span>
              <span style={styles.value}>₦{Math.max(0, invoice.amountPaid - payment.amountPaid).toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Details */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>💳 Payment Details</div>
            <div style={styles.row}>
              <span style={styles.label}>Amount Paid:</span>
              <span style={styles.valueLarge}>₦{payment.amountPaid.toLocaleString()}</span>
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Payment Date:</span>
              <span style={styles.value}>{new Date(payment.paymentDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Payment Method:</span>
              <span style={styles.value}>{payment.paymentMethod}</span>
            </div>
            {payment.bankName && (
              <div style={styles.row}>
                <span style={styles.label}>Bank:</span>
                <span style={styles.valueBold}>{payment.bankName}</span>
              </div>
            )}
            <div style={styles.row}>
              <span style={styles.label}>Paid By:</span>
              <span style={styles.value}>{payment.paidByName}</span>
            </div>
            {payment.transactionReference && (
              <div style={styles.row}>
                <span style={styles.label}>Reference:</span>
                <span style={styles.value}>{payment.transactionReference}</span>
              </div>
            )}
          </div>

          {/* Invoice Summary */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>📊 Invoice Summary</div>
            <div style={styles.row}>
              <span style={styles.label}>Total Expected:</span>
              <span style={styles.valueBold}>₦{invoice.totalAmount.toLocaleString()}</span>
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Total Paid (Including This):</span>
              <span style={styles.valueBold}>₦{invoice.amountPaid.toLocaleString()}</span>
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Balance Remaining:</span>
              <span style={styles.valueBold}>₦{invoice.balanceDue.toLocaleString()}</span>
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Status:</span>
              <span style={{...styles.value, color: invoice.status === 'Paid' ? '#059669' : '#d97706', fontWeight: 'bold'}}>
                {invoice.status}
              </span>
            </div>
          </div>

          {/* Status */}
          {invoice.status === 'Paid' && (
            <div style={styles.statusBox}>
              ✅ PAID IN FULL
            </div>
          )}

          {/* Footer */}
          <div style={styles.footer}>
            <p>Thank you for your payment</p>
            <p>© 2026 Albayyan International School. All rights reserved.</p>
            <p style={styles.timestamp}>Generated: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    maxWidth: '700px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '2px solid #f0f0f0',
    position: 'sticky',
    top: 0,
    backgroundColor: 'white',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#666',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
  },
  actionBtn: {
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  receipt: {
    padding: '40px',
    fontFamily: '"Courier New", monospace',
    lineHeight: '1.6',
  },
  receiptHeader: {
    textAlign: 'center',
    marginBottom: '30px',
    borderBottom: '2px solid #2563eb',
    paddingBottom: '20px',
  },
  receiptLogoContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '10px',
  },
  receiptLogo: {
    width: '70px',
    height: '70px',
    objectFit: 'contain',
  },
  receiptHeaderText: {
    textAlign: 'left',
  },
  schoolName: {
    margin: '0',
    fontSize: '22px',
    color: '#2563eb',
    fontWeight: 'bold',
  },
  schoolSubtitle: {
    margin: '8px 0 4px 0',
    fontSize: '12px',
    color: '#666',
  },
  schoolAddress: {
    margin: '0',
    fontSize: '14px',
    color: '#000',
    fontWeight: 'bold',
  },
  receiptNumberBox: {
    backgroundColor: '#f0f0f0',
    border: '2px solid #2563eb',
    borderLeft: '6px solid #2563eb',
    padding: '15px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  receiptNumberLabel: {
    fontSize: '12px',
    color: '#666',
    fontWeight: 'bold',
  },
  receiptNumberValue: {
    fontSize: '20px',
    color: '#2563eb',
    fontWeight: 'bold',
    marginTop: '5px',
  },
  section: {
    marginBottom: '25px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    borderBottom: '2px solid #2563eb',
    paddingBottom: '8px',
    marginBottom: '12px',
    color: '#2563eb',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px dotted #ddd',
    fontSize: '13px',
  },
  label: {
    color: '#666',
    fontWeight: '600',
  },
  value: {
    color: '#000',
    textAlign: 'right',
  },
  valueBold: {
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  valueLarge: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: '16px',
    textAlign: 'right',
  },
  statusBox: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    padding: '15px',
    textAlign: 'center',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '16px',
    marginTop: '20px',
  },
  footer: {
    textAlign: 'center',
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '2px solid #ddd',
    fontSize: '12px',
    color: '#999',
  },
  timestamp: {
    fontSize: '10px',
    margin: '8px 0 0 0',
  },
};

export default ReceiptModal;
