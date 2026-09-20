/* Stock Reorder App - v4 (department-aware) */

const LS = {
  list: "reorderList",
  wa: "whatsappNumber",
  custom: "customProducts",
  currency: "currencySymbol",
  shop: "shopName"
};

const state = {
  reorder: JSON.parse(localStorage.getItem(LS.list) || "{}"),
  whatsapp: localStorage.getItem(LS.wa) || "",
  custom: JSON.parse(localStorage.getItem(LS.custom) || "[]"),
  currency: localStorage.getItem(LS.currency) || "£",
  shop: localStorage.getItem(LS.shop) || ""
};

let reader = null, running = false, lastDetectedBarcode = "", unlockTimer = null, pendingBarcode = "";

const $ = id => document.getElementById(id);
const esc = s => String(s === undefined || s === null ? "" : s)
  .replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));

/* ---------- product database (built-in + products added on the phone) ---------- */

function allProducts() {
  const map = new Map();
  PRODUCTS.forEach(p => map.set(String(p.barcode).trim(), p));
  state.custom.forEach(p => map.set(String(p.barcode).trim(), p)); // custom entries win
  return Array.from(map.values());
}

function findProduct(b) {
  b = String(b).trim();
  return allProducts().find(p => String(p.barcode).trim() === b);
}

function saveCustom() {
  localStorage.setItem(LS.custom, JSON.stringify(state.custom));
}

function upsertCustom(prod) {
  const i = state.custom.findIndex(p => String(p.barcode).trim() === prod.barcode);
  if (i >= 0) state.custom[i] = prod; else state.custom.push(prod);
  saveCustom();
}

function cleanDept(d) {
  d = String(d || "").trim();
  const hit = DEPARTMENTS.find(x => x.toLowerCase() === d.toLowerCase());
  return hit || (d ? d : "Other");
}

function money(n) {
  const v = Number(n || 0);
  return state.currency + v.toFixed(2);
}

/* ---------- reorder list ---------- */

function save() { localStorage.setItem(LS.list, JSON.stringify(state.reorder)); }

function msg(t, c = "") {
  const el = $("message");
  el.textContent = t;
  el.className = "message " + c;
  clearTimeout(msg._t);
  msg._t = setTimeout(() => { el.textContent = ""; el.className = "message"; }, 3500);
}

function addProduct(b) {
  b = String(b).trim();
  if (!b) return;
  const p = findProduct(b);
  if (!p) { openNewProduct(b); return; }
  if (state.reorder[b]) {
    state.reorder[b].qty++;
    // keep the line in step with the database in case the product was edited
    state.reorder[b].name = p.name;
    state.reorder[b].price = Number(p.price) || 0;
    state.reorder[b].dept = cleanDept(p.dept);
  } else {
    state.reorder[b] = {
      barcode: b,
      name: p.name,
      price: Number(p.price) || 0,
      dept: cleanDept(p.dept),
      qty: 1
    };
  }
  save(); render();
  msg(p.name + " · " + cleanDept(p.dept) + " · " + money(p.price) + " added", "success");
}

function changeQty(b, d) {
  if (!state.reorder[b]) return;
  state.reorder[b].qty += d;
  if (state.reorder[b].qty <= 0) delete state.reorder[b];
  save(); render();
}

function setQty(b, v) {
  if (!state.reorder[b]) return;
  const n = parseInt(v, 10);
  if (isNaN(n) || n <= 0) { delete state.reorder[b]; } else { state.reorder[b].qty = n; }
  save(); render();
}

function setItemDept(b, d) {
  if (!state.reorder[b]) return;
  state.reorder[b].dept = cleanDept(d);
  const p = findProduct(b);
  if (p) upsertCustom({ barcode: b, name: p.name, price: Number(p.price) || 0, dept: cleanDept(d) });
  save(); render();
}

function removeItem(b) { delete state.reorder[b]; save(); render(); }

/* ---------- grouping ---------- */

function groupByDept() {
  const items = Object.values(state.reorder);
  const groups = {};
  items.forEach(x => {
    const d = cleanDept(x.dept);
    (groups[d] = groups[d] || []).push(x);
  });
  const order = DEPARTMENTS.filter(d => groups[d]);
  Object.keys(groups).forEach(d => { if (!order.includes(d)) order.push(d); });
  return order.map(d => {
    const rows = groups[d].sort((a, b) => a.name.localeCompare(b.name));
    return {
      dept: d,
      rows,
      units: rows.reduce((a, x) => a + x.qty, 0),
      value: rows.reduce((a, x) => a + x.qty * (Number(x.price) || 0), 0)
    };
  });
}

/* ---------- rendering ---------- */

function deptOptions(selected) {
  const list = DEPARTMENTS.slice();
  if (selected && !list.includes(selected)) list.push(selected);
  return list.map(d => `<option value="${esc(d)}"${d === selected ? " selected" : ""}>${esc(d)}</option>`).join("");
}

function render() {
  const groups = groupByDept();
  const totalUnits = groups.reduce((a, g) => a + g.units, 0);
  const totalValue = groups.reduce((a, g) => a + g.value, 0);

  $("itemCount").textContent = totalUnits;
  $("emptyState").style.display = groups.length ? "none" : "block";
  $("listTotals").style.display = groups.length ? "flex" : "none";
  $("totalLines").textContent = groups.reduce((a, g) => a + g.rows.length, 0) + " lines in " + groups.length + " department" + (groups.length === 1 ? "" : "s");
  $("totalValue").textContent = "Retail value " + money(totalValue);

  $("reorderList").innerHTML = groups.map(g => `
    <div class="dept-group">
      <div class="dept-head">
        <span class="dept-name">${esc(g.dept)}</span>
        <span class="dept-meta">${g.rows.length} line${g.rows.length === 1 ? "" : "s"} · ${g.units} unit${g.units === 1 ? "" : "s"} · ${esc(money(g.value))}</span>
      </div>
      ${g.rows.map(x => `
        <div class="product">
          <div class="product-name">${esc(x.name)}</div>
          <div class="barcode">${esc(x.barcode)} · ${esc(money(x.price))} each · line ${esc(money(x.qty * (Number(x.price) || 0)))}</div>
          <div class="row-dept">
            <label>Department</label>
            <select onchange="setItemDept('${esc(x.barcode)}',this.value)">${deptOptions(cleanDept(x.dept))}</select>
          </div>
          <div class="qty">
            <button class="secondary" onclick="changeQty('${esc(x.barcode)}',-1)" aria-label="Reduce quantity">−</button>
            <input class="qty-input" type="number" min="1" value="${x.qty}" onchange="setQty('${esc(x.barcode)}',this.value)" aria-label="Quantity for ${esc(x.name)}">
            <button class="secondary" onclick="changeQty('${esc(x.barcode)}',1)" aria-label="Increase quantity">+</button>
            <button type="button" class="delete-item" onclick="removeItem('${esc(x.barcode)}')" aria-label="Delete ${esc(x.name)}" title="Delete item">🗑️</button>
          </div>
        </div>`).join("")}
    </div>`).join("");
}

/* ---------- new product capture (unknown barcode) ---------- */

function openNewProduct(barcode) {
  pendingBarcode = String(barcode).trim();
  $("npBarcode").value = pendingBarcode;
  $("npName").value = "";
  $("npPrice").value = "";
  $("npDept").innerHTML = deptOptions("Grocery");
  $("newProduct").style.display = "block";
  $("newProduct").scrollIntoView({ behavior: "smooth", block: "center" });
  $("npName").focus();
  msg("Barcode " + pendingBarcode + " is not in the database. Add its details below.", "error");
}

function closeNewProduct() {
  $("newProduct").style.display = "none";
  pendingBarcode = "";
  lastDetectedBarcode = "";
}

function saveNewProduct() {
  const barcode = $("npBarcode").value.trim();
  const name = $("npName").value.trim();
  const price = parseFloat($("npPrice").value);
  const dept = cleanDept($("npDept").value);
  if (!barcode) { msg("Enter a barcode.", "error"); return; }
  if (!name) { msg("Enter the product name.", "error"); $("npName").focus(); return; }
  if (isNaN(price) || price < 0) { msg("Enter the selling price.", "error"); $("npPrice").focus(); return; }
  upsertCustom({ barcode, name, price, dept });
  $("newProduct").style.display = "none";
  pendingBarcode = "";
  addProduct(barcode);
  search();
  renderDbCount();
}

/* ---------- PDF ---------- */

async function sendWhatsApp() {
  const groups = groupByDept();
  if (!groups.length) { msg("Your reorder list is empty.", "error"); return; }
  const n = state.whatsapp.replace(/\D/g, "");
  if (!n) { msg("Save a WhatsApp destination number first.", "error"); $("whatsappNumber").focus(); return; }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const now = new Date();
    const pageH = doc.internal.pageSize.getHeight();

    doc.setFontSize(18);
    doc.text("STOCK REORDER LIST", 14, 18);
    doc.setFontSize(10);
    let y = 25;
    if (state.shop) { doc.text(state.shop, 14, y); y += 5; }
    doc.text("Generated: " + now.toLocaleString("en-GB"), 14, y);
    y += 8;

    let grandUnits = 0, grandValue = 0;

    groups.forEach(g => {
      grandUnits += g.units;
      grandValue += g.value;

      if (y > pageH - 45) { doc.addPage(); y = 18; }

      const body = g.rows.map((x, i) => [
        String(i + 1),
        x.name,
        x.barcode,
        money(x.price),
        String(x.qty),
        money(x.qty * (Number(x.price) || 0))
      ]);

      doc.autoTable({
        startY: y,
        head: [
          [{ content: g.dept.toUpperCase(), colSpan: 6, styles: { halign: "left", fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold", fontSize: 11 } }],
          ["No.", "Product", "Barcode", "Price", "Qty", "Line total"]
        ],
        body: body,
        foot: [[
          { content: g.dept + " subtotal", colSpan: 4, styles: { halign: "right", fontStyle: "bold" } },
          { content: String(g.units), styles: { fontStyle: "bold" } },
          { content: money(g.value), styles: { fontStyle: "bold" } }
        ]],
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 2.4 },
        headStyles: { fillColor: [226, 232, 240], textColor: 20, fontStyle: "bold" },
        footStyles: { fillColor: [241, 245, 249], textColor: 20 },
        columnStyles: {
          0: { cellWidth: 11 },
          1: { cellWidth: 63 },
          2: { cellWidth: 36 },
          3: { cellWidth: 20, halign: "right" },
          4: { cellWidth: 15, halign: "center" },
          5: { cellWidth: 27, halign: "right" }
        },
        margin: { left: 14, right: 14 }
      });

      const last = doc.lastAutoTable || (doc.previousAutoTable || {});
      y = (last.finalY || y + 10 * (g.rows.length + 2)) + 7;
    });

    if (y > pageH - 30) { doc.addPage(); y = 18; }
    doc.autoTable({
      startY: y,
      body: [[
        { content: "TOTAL — " + groups.length + " department" + (groups.length === 1 ? "" : "s"), styles: { halign: "right", fontStyle: "bold" } },
        { content: grandUnits + " units", styles: { halign: "center", fontStyle: "bold" } },
        { content: money(grandValue), styles: { halign: "right", fontStyle: "bold" } }
      ]],
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3, fillColor: [15, 23, 42], textColor: 255 },
      columnStyles: { 0: { cellWidth: 130 }, 1: { cellWidth: 15 }, 2: { cellWidth: 27 } },
      margin: { left: 14, right: 14 }
    });

    const blob = doc.output("blob");
    const filename = "Stock-Reorder-" + now.toISOString().slice(0, 10) + ".pdf";
    const file = new File([blob], filename, { type: "application/pdf" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ title: "Stock Reorder List", text: whatsappText(groups, grandUnits, grandValue), files: [file] });
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);

    window.open("https://wa.me/" + n + "?text=" + encodeURIComponent(whatsappText(groups, grandUnits, grandValue)), "_blank");
    msg("PDF downloaded. Attach it in WhatsApp.", "success");
  } catch (e) {
    console.error(e);
    msg("Could not create PDF: " + (e.message || "unknown error"), "error");
  }
}

function whatsappText(groups, units, value) {
  const head = (state.shop ? state.shop + " — " : "") + "Stock reorder, " + new Date().toLocaleDateString("en-GB");
  const lines = groups.map(g => g.dept + ": " + g.rows.length + " lines, " + g.units + " units");
  return head + "\n" + lines.join("\n") + "\nTotal: " + units + " units, " + money(value) + "\n(PDF attached)";
}

/* ---------- settings ---------- */

function saveSettings() {
  state.whatsapp = $("whatsappNumber").value.trim();
  state.shop = $("shopName").value.trim();
  state.currency = ($("currencySymbol").value.trim() || "£").slice(0, 3);
  localStorage.setItem(LS.wa, state.whatsapp);
  localStorage.setItem(LS.shop, state.shop);
  localStorage.setItem(LS.currency, state.currency);
  $("settingsStatus").textContent = "Settings saved.";
  render(); search();
}

/* ---------- product database section ---------- */

function renderDbCount() {
  $("dbCount").textContent = allProducts().length + " products (" + state.custom.length + " added on this phone)";
}

function search() {
  const q = $("searchProduct").value.toLowerCase().trim();
  const dept = $("filterDept").value;
  let list = allProducts();
  if (dept) list = list.filter(p => cleanDept(p.dept) === dept);
  if (q) list = list.filter(p => p.name.toLowerCase().includes(q) || String(p.barcode).includes(q));
  if (!q && !dept) { $("productResults").innerHTML = ""; return; }
  $("productResults").innerHTML = list.slice(0, 40).map(p => `
    <div class="product search">
      <div>
        <div class="product-name">${esc(p.name)}</div>
        <div class="barcode">${esc(p.barcode)} · ${esc(cleanDept(p.dept))} · ${esc(money(p.price))}</div>
      </div>
      <button class="primary" onclick="addProduct('${esc(p.barcode)}')">Add</button>
    </div>`).join("") || `<p class="small">No matching products.</p>`;
}

function importCsv(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const lines = String(r.result).split(/\r?\n/).filter(l => l.trim());
      let added = 0, skipped = 0;
      lines.forEach((line, idx) => {
        const cells = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
        if (idx === 0 && /barcode/i.test(cells[0])) return; // header row
        const [barcode, name, price, dept] = cells;
        if (!barcode || !name) { skipped++; return; }
        upsertCustom({
          barcode: String(barcode).trim(),
          name: name,
          price: parseFloat(price) || 0,
          dept: cleanDept(dept)
        });
        added++;
      });
      renderDbCount(); search();
      $("dbStatus").textContent = added + " products imported" + (skipped ? ", " + skipped + " rows skipped" : "") + ".";
    } catch (e) {
      $("dbStatus").textContent = "Import failed: " + (e.message || "check the file format");
    }
  };
  r.readAsText(file);
}

function exportCsv() {
  const rows = [["barcode", "name", "price", "department"]]
    .concat(allProducts().map(p => [p.barcode, p.name, Number(p.price || 0).toFixed(2), cleanDept(p.dept)]));
  const csv = rows.map(r => r.map(c => /[",]/.test(String(c)) ? '"' + String(c).replace(/"/g, '""') + '"' : c).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "product-database.csv";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  $("dbStatus").textContent = "Database exported as CSV.";
}

/* ---------- camera ---------- */

async function startCamera() {
  try {
    if (!window.isSecureContext) { msg("Camera requires HTTPS. GitHub Pages uses HTTPS.", "error"); return; }
    if (!window.ZXing) { msg("Scanner library failed to load.", "error"); return; }

    stopCamera();
    reader = new ZXing.BrowserMultiFormatReader();
    $("cameraStatus").textContent = "Requesting camera permission...";
    $("startCamera").disabled = true;
    $("stopCamera").disabled = false;
    $("scanLine").style.display = "block";

    const ds = await reader.listVideoInputDevices();
    if (!ds.length) throw Error("No camera found.");
    let id = ds[ds.length - 1].deviceId;
    const rear = ds.find(d => /back|rear|environment/i.test(d.label));
    if (rear) id = rear.deviceId;

    running = true;
    lastDetectedBarcode = "";
    clearTimeout(unlockTimer);
    $("cameraStatus").textContent = "Camera running — scan continuously. Press Stop Camera when finished.";

    reader.decodeFromVideoDevice(id, "video", (result) => {
      if (!running) return;
      if (result) {
        const barcode = String(result.getText()).trim();
        if (!barcode) return;
        if (barcode !== lastDetectedBarcode) {
          lastDetectedBarcode = barcode;
          addProduct(barcode);
        }
        clearTimeout(unlockTimer);
      } else {
        scheduleBarcodeUnlock();
      }
    });
  } catch (e) {
    console.error(e);
    msg(e.message || "Camera error. Check permission.", "error");
    stopCamera();
  }
}

function scheduleBarcodeUnlock() {
  clearTimeout(unlockTimer);
  unlockTimer = setTimeout(() => { if (!pendingBarcode) lastDetectedBarcode = ""; }, 800);
}

function stopCamera() {
  running = false;
  clearTimeout(unlockTimer);
  lastDetectedBarcode = "";
  if (reader) { try { reader.reset() } catch (e) { } reader = null }
  const v = $("video");
  if (v.srcObject) { v.srcObject.getTracks().forEach(t => t.stop()); v.srcObject = null }
  $("startCamera").disabled = false;
  $("stopCamera").disabled = true;
  $("scanLine").style.display = "none";
  $("cameraStatus").textContent = "Camera is stopped.";
}

/* ---------- start up ---------- */

function migrate() {
  let changed = false;
  Object.values(state.reorder).forEach(x => {
    if (x.dept === undefined || x.price === undefined) {
      const p = findProduct(x.barcode);
      x.price = Number(x.price !== undefined ? x.price : (p ? p.price : 0)) || 0;
      x.dept = cleanDept(x.dept || (p ? p.dept : "Other"));
      changed = true;
    }
  });
  if (changed) save();
}

$("startCamera").onclick = startCamera;
$("stopCamera").onclick = stopCamera;
$("addBarcode").onclick = () => { addProduct($("barcodeInput").value); $("barcodeInput").value = "" };
$("barcodeInput").onkeydown = e => { if (e.key === "Enter") $("addBarcode").click() };
$("clearList").onclick = () => { if (Object.keys(state.reorder).length && confirm("Clear the entire reorder list?")) { state.reorder = {}; save(); render() } };
$("sendWhatsApp").onclick = sendWhatsApp;
$("saveSettings").onclick = saveSettings;
$("searchProduct").oninput = search;
$("filterDept").onchange = search;
$("npSave").onclick = saveNewProduct;
$("npCancel").onclick = closeNewProduct;
$("addManualProduct").onclick = () => openNewProduct($("barcodeInput").value.trim());
$("exportDb").onclick = exportCsv;
$("importDb").onchange = e => { if (e.target.files[0]) importCsv(e.target.files[0]); e.target.value = ""; };

$("whatsappNumber").value = state.whatsapp;
$("shopName").value = state.shop;
$("currencySymbol").value = state.currency;
$("filterDept").innerHTML = `<option value="">All departments</option>` + DEPARTMENTS.map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join("");
$("npDept").innerHTML = deptOptions("Grocery");

migrate();
render();
renderDbCount();
