from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from datetime import datetime
import io

def generate_statement_pdf(tenant_name, unit_name, total_due, total_paid, balance, transactions):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], alignment=1, spaceAfter=20)
    elements.append(Paragraph("Statement of Account", title_style))
    
    # Tenant Info
    elements.append(Paragraph(f"<b>Tenant:</b> {tenant_name}", styles['Normal']))
    elements.append(Paragraph(f"<b>Unit:</b> {unit_name}", styles['Normal']))
    elements.append(Paragraph(f"<b>Date:</b> {datetime.now().strftime('%Y-%m-%d')}", styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Summary Table
    summary_data = [
        ["Total Due", "Total Paid", "Balance"],
        [f"${total_due:,.2f}", f"${total_paid:,.2f}", f"${balance:,.2f}"]
    ]
    summary_table = Table(summary_data, colWidths=[150, 150, 150])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.whitesmoke),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, 1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('TEXTCOLOR', (2, 1), (2, 1), colors.red if balance > 0 else colors.green)
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 30))
    
    # Transactions Table
    elements.append(Paragraph("<b>Transaction History</b>", styles['Heading2']))
    elements.append(Spacer(1, 10))
    
    trans_data = [["Date", "Description", "Amount", "Status"]]
    for t in transactions:
        trans_data.append([
            t['date'],
            t['description'],
            f"${t['amount']:,.2f}",
            t['status'].upper()
        ])
    
    trans_table = Table(trans_data, colWidths=[100, 200, 100, 100])
    trans_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
    ]))
    elements.append(trans_table)
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer
