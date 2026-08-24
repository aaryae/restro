/** Shared react-to-print page styles — always white paper, dark ink. */

export const printForceWhiteStyles = `
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    color: #111111 !important;
  }
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .kot-print,
  #kot-print,
  #bill-print {
    background: #ffffff !important;
    color: #111111 !important;
  }
  .kot-print *,
  #kot-print *,
  #bill-print * {
    color: #111111 !important;
    background-color: transparent !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }
  .kot-print,
  #kot-print,
  #bill-print {
    background-color: #ffffff !important;
  }
  #bill-print th,
  #bill-print thead tr {
    background-color: #f5f5f5 !important;
  }
  #bill-print td,
  #bill-print th {
    border-color: #000000 !important;
  }
  .no-print {
    display: none !important;
  }
`;

const kotTicketStyles = `
  .kot-print { width: 80mm !important; font-size: 10px !important; line-height: 1.25 !important; }
  .kot-print * { font-size: 10px !important; line-height: 1.25 !important; }
  .kot-print .kot-title { font-size: 14px !important; font-weight: 800 !important; }
  .kot-print .tight { margin: 4px 0 !important; padding: 0 !important; }
  .kot-print .section-gap { margin: 6px 0 !important; }
  .kot-print .border-dashed { border-color: #000 !important; }
  .kot-print .border-t {
    border-top-width: .5008px !important;
    border-top-style: dashed !important;
    border-top-color: #000 !important;
  }
  .kot-print .divider-dashed {
    border: 0 !important;
    height: 1px !important;
    background-image: repeating-linear-gradient(to right, #000 0, #000 8px, transparent 8px, transparent 12px) !important;
    background-repeat: repeat-x !important;
    background-size: 100% 1px !important;
    background-position: 0 .5008px !important;
  }
  .kot-print .number { margin: 0 !important; }
  .screen-compact {
    max-height: none !important;
    overflow: visible !important;
  }
`;

const billTicketStyles = `
  #bill-print {
    width: 80mm !important;
    max-width: 80mm !important;
    margin: 0 auto !important;
    padding: 0 !important;
  }
  #bill-print h1 { font-size: 14px !important; }
  #bill-print h2 { font-size: 12px !important; }
  #bill-print h3, #bill-print p, #bill-print span { font-size: 10px !important; }
  #bill-print table { width: 100% !important; border-collapse: collapse !important; }
  #bill-print th, #bill-print td { padding: 4px 6px !important; }
  #bill-print th { font-weight: 600 !important; }
  #bill-print tr { page-break-inside: avoid; }
  #bill-print thead { display: table-header-group; }
  #bill-print tfoot { display: table-footer-group; }
`;

export const kotPrintPageStyle = `
  @page { size: 80mm auto; margin: 4mm; }
  @media print {
    ${printForceWhiteStyles}
    ${kotTicketStyles}
  }
`;

export const billPrintPageStyle = `
  @page { size: 80mm auto; margin: 5mm 3mm; }
  @media print {
    ${printForceWhiteStyles}
    ${billTicketStyles}
  }
`;
