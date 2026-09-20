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


### Version 3 update
The Reorder List now uses a prominent red trash-can delete icon instead of a text Remove button.

If GitHub Pages appears to show the previous version, hard-refresh the page (Ctrl+F5 on Windows) or open it in a private/incognito window.


## Continuous barcode scanning

The camera now stays running after a successful scan. Staff can move from one product to the next without pressing Start Camera again.

- Start Camera once.
- Scan product after product; each new barcode is added automatically.
- The same barcode is not repeatedly added while it remains in front of the camera.
- Move the barcode out of view before scanning that same product again.
- Press Stop Camera when finished.


## Version 4 — department-wise reordering

### What is captured on every scan
Each barcode now brings back the product name, the selling price and the department
(Grocery, Alcohol, Tobacco and the rest of the list at the top of `products.js`).

### Unknown barcodes
If a scanned barcode is not in the database, a yellow form opens with the barcode
already filled in. Enter the product name, selling price and department once, press
"Save and add to list", and the product is stored on the phone for every future scan.

### Department-wise list
Staff can scan Grocery, then Tobacco, then Alcohol in any order — the Reorder List
sorts them into department blocks automatically, with lines, units and retail value
per department. Each line has a department dropdown, so a wrong department can be
corrected on the spot (the correction is saved to the database too).

### Department-wise PDF
The PDF now prints one table per department with a dark department heading, columns
No. | Product | Barcode | Price | Qty | Line total, a subtotal row per department and
a grand total at the end. Shop name and date appear at the top.

### Settings
Shop name (printed on the PDF), WhatsApp number, and currency symbol.

### Product Database
- Search by name or barcode, filter by department.
- Import CSV with columns: barcode, name, price, department (header row optional).
  This is how to load your 4,000+ products without editing code.
- Export CSV to back up the database, including everything added on the phone.

Hard-refresh (Ctrl+F5) or use a private window if GitHub Pages still shows the old version.
