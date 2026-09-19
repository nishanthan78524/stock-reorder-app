# Stock Reorder App

Upload all files in this folder to the ROOT of a GitHub repository.

Files:
- index.html
- style.css
- app.js
- products.js
- README.md
- .nojekyll

## GitHub Pages
1. Create a repository, for example `stock-reorder-app`.
2. Upload all files to the repository root.
3. Settings -> Pages.
4. Source: Deploy from a branch.
5. Branch: `main`; folder: `/ (root)`.
6. Save and wait for deployment.
7. Open the HTTPS GitHub Pages URL on your phone.

## Test
Manual test barcodes:
5012345678901
5012345678902
5012345678903
5012345678904
5012345678905
5012345678906
5012345678907
5012345678908
5012345678909
5012345678910

Set the WhatsApp destination in Settings using international format without + or spaces.

Camera scanning uses ZXing and requires HTTPS. GitHub Pages provides HTTPS.

The current product database is only sample data. For your 4,000+ products, the next version should connect to a proper database/API.


## Added in this version

### Lynx Gold
Product: Lynx Gold
Barcode: 8720181369599

### PDF reorder list
The WhatsApp button creates an A4 PDF with a table containing:
No. | Product | Quantity | Barcode

On supported phones, the browser share sheet can send the PDF directly to WhatsApp.
If direct file sharing is unavailable, the PDF is downloaded and WhatsApp opens with a message; attach the downloaded PDF manually.
