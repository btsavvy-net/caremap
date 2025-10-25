export const pdfStyles = `
  @page {
    margin: 0.5in;
    size: letter;
  }
  
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 0;
    padding: 8px;
    color: #2c3e50;
    line-height: 1.4;
    background-color: #ffffff;
  }
  
  .document-container {
    max-width: 100%;
    margin: 0 auto;
  }
  
  .header {
    text-align: center;
    margin-bottom: 15px;
    padding: 12px 0;
    border-bottom: 2px solid #3498db;
    background: linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%);
    border-radius: 6px 6px 0 0;
  }
  
  .logo {
    font-size: 28px;
    font-weight: 700;
    color: #2980b9;
    margin-bottom: 8px;
    letter-spacing: 1px;
  }
  
  .subtitle {
    font-size: 16px;
    color: #5a6c7d;
    font-weight: 500;
  }
  
  .date {
    margin-top: 15px;
    font-size: 14px;
    color: #7f8c8d;
    font-weight: 500;
  }
  
  .patient-summary {
    background: linear-gradient(135deg, #f8fafc 0%, #e8f4f8 100%);
    border: 1px solid #e3f2fd;
    border-left: 4px solid #3498db;
    padding: 12px;
    margin: 12px 0;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(52, 152, 219, 0.15);
    position: relative;
    overflow: hidden;
  }
  
  .patient-summary:before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 60px;
    height: 60px;
    background: radial-gradient(circle, rgba(52, 152, 219, 0.1) 0%, transparent 70%);
    border-radius: 50%;
    transform: translate(20px, -20px);
  }
  
  .section {
    margin-bottom: 20px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  
  h2 {
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
    margin: 15px 0 10px 0;
    padding: 8px 0 6px 0;
    border-bottom: 2px solid #3498db;
    position: relative;
  }
  
  h2:before {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 60px;
    height: 2px;
    background: #e74c3c;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 8px;
  }
  
  .info-row {
    display: flex;
    align-items: center;
    padding: 6px 8px;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 4px;
    border: 1px solid rgba(52, 152, 219, 0.1);
    transition: all 0.2s ease;
  }
  
  .info-row:hover {
    background: rgba(255, 255, 255, 0.9);
    border-color: rgba(52, 152, 219, 0.2);
    transform: translateY(-1px);
  }
  
  .info-label {
    font-weight: 600;
    color: #2c3e50;
    width: 110px;
    flex-shrink: 0;
    font-size: 13px;
    position: relative;
  }
  
  .info-label:after {
    content: ':';
    margin-left: 2px;
    color: #3498db;
  }
  
  .info-value {
    color: #34495e;
    flex: 1;
    font-weight: 500;
    font-size: 13px;
  }
  
  .info-value.highlight {
    color: #2980b9;
    font-weight: 600;
  }
  
  .health-table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 15px 0;
    font-size: 12px;
    background: white;
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    border-radius: 6px;
    overflow: hidden;
    page-break-inside: avoid;
  }
  
  .health-table thead {
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  }
  
  .health-table th {
    color: white;
    font-weight: 600;
    padding: 8px 6px;
    text-align: left;
    font-size: 12px;
    letter-spacing: 0.3px;
    border: none;
  }
  
  .health-table td {
    padding: 6px;
    border-bottom: 1px solid #ecf0f1;
    vertical-align: top;
    line-height: 1.3;
  }
  
  .health-table tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  
  .health-table tbody tr:nth-child(even) {
    background-color: #f8fafc;
  }
  
  .health-table tbody tr:hover {
    background-color: #e8f4f8;
  }
  
  .health-table tbody tr:last-child td {
    border-bottom: none;
  }
  
  .no-data {
    text-align: center;
    padding: 20px 15px;
    color: #7f8c8d;
    font-style: italic;
    background: #f8f9fa;
    border-radius: 6px;
    border: 1px dashed #bdc3c7;
    margin: 10px 0;
  }
  
  .status-badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .status-yes {
    background: #d5f4e6;
    color: #27ae60;
  }
  
  .status-no {
    background: #ffeaa7;
    color: #e17055;
  }
  
  .severity-mild {
    background: #dff0d8;
    color: #3c763d;
  }
  
  .severity-moderate {
    background: #fcf8e3;
    color: #8a6d3b;
  }
  
  .severity-severe {
    background: #f2dede;
    color: #a94442;
  }
  
  .footer {
    margin-top: 30px;
    padding: 15px;
    text-align: center;
    font-size: 11px;
    color: #7f8c8d;
    border-top: 1px solid #ecf0f1;
    background: #f8f9fa;
    border-radius: 6px;
    page-break-inside: avoid;
  }
  
  .footer-warning {
    font-weight: 600;
    color: #e74c3c;
    margin-bottom: 8px;
  }
  
  .page-break {
    page-break-before: always;
  }
  
  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .section {
      page-break-inside: avoid;
    }
    
    .health-table {
      page-break-inside: avoid;
    }
    
    .health-table tr {
      page-break-inside: avoid;
    }
  }
`;
