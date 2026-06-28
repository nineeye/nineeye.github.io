from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.platypus import Table

def create_test_pdf():
    c = canvas.Canvas("test_table.pdf", pagesize=letter)
    data = [
        ["품목", "수량", "단가", "합계"],
        ["사과", "10", "1000", "=B2*C2"],
        ["배", "5", "2000", "=B3*C3"],
        ["포도", "3", "5000", "=B4*C4"]
    ]
    t = Table(data, colWidths=100, rowHeights=30)
    t.wrapOn(c, 100, 400)
    t.drawOn(c, 100, 400)
    c.save()

create_test_pdf()
