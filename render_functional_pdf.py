import fitz
from pathlib import Path

pdf = Path(r"C:\xampp\htdocs\BloodLink\functional_testing_render\BloodLink Functional Testing Form.pdf")
out = Path(r"C:\xampp\htdocs\BloodLink\functional_testing_render_final\pages")
out.mkdir(parents=True, exist_ok=True)
doc = fitz.open(pdf)
for i, page in enumerate(doc):
    pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
    pix.save(out / f"page-{i + 1}.png")
print(f"Rendered {len(doc)} pages")
