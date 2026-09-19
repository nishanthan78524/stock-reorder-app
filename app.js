const state={reorder:JSON.parse(localStorage.getItem("reorderList")||"{}"),whatsapp:localStorage.getItem("whatsappNumber")||""};
let reader=null,running=false,lastDetectedBarcode="",unlockTimer=null;
const $=id=>document.getElementById(id);
function save(){localStorage.setItem("reorderList",JSON.stringify(state.reorder))}
function findProduct(b){return PRODUCTS.find(p=>p.barcode===String(b).trim())}
function msg(t,c=""){$("message").textContent=t;$("message").className="message "+c;setTimeout(()=>{$("message").textContent=""},3500)}
function addProduct(b){b=String(b).trim();if(!b)return;const p=findProduct(b);if(!p){msg("Product not found: "+b,"error");return}if(state.reorder[b])state.reorder[b].qty++;else state.reorder[b]={barcode:b,name:p.name,qty:1};save();render();msg(p.name+" added","success")}
function changeQty(b,d){if(!state.reorder[b])return;state.reorder[b].qty+=d;if(state.reorder[b].qty<=0)delete state.reorder[b];save();render()}
function removeItem(b){delete state.reorder[b];save();render()}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function render(){const items=Object.values(state.reorder);$("itemCount").textContent=items.reduce((a,x)=>a+x.qty,0);$("emptyState").style.display=items.length?"none":"block";$("reorderList").innerHTML=items.map(x=>`<div class="product"><div class="product-name">${esc(x.name)}</div><div class="barcode">Barcode: ${esc(x.barcode)}</div><div class="qty"><button class="secondary" onclick="changeQty('${x.barcode}',-1)">−</button><span>${x.qty}</span><button class="secondary" onclick="changeQty('${x.barcode}',1)">+</button><button class="delete-item" onclick="removeItem('${x.barcode}')" aria-label="Delete ${esc(x.name)}" title="Delete item"><svg class="delete-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 3h6l1 2h4v2H4V5h4l1-2zm-3 6h12l-1 12H7L6 9zm3 2v8h2v-8H9zm4 0v8h2v-8h-2z"/></svg></button></div></div>`).join("")}
async function sendWhatsApp(){
const items=Object.values(state.reorder);
if(!items.length){msg("Your reorder list is empty.","error");return}
const n=state.whatsapp.replace(/\D/g,"");
if(!n){msg("Save a WhatsApp destination number first.","error");$("whatsappNumber").focus();return}

try{
const {jsPDF}=window.jspdf;
const doc=new jsPDF({unit:"mm",format:"a4"});
const now=new Date();
doc.setFontSize(18);
doc.text("STOCK REORDER LIST",14,18);
doc.setFontSize(10);
doc.text("Generated: "+now.toLocaleString("en-GB"),14,25);

const rows=items.map((x,i)=>[String(i+1),x.name,String(x.qty),x.barcode]);
doc.autoTable({
startY:31,
head:[["No.","Product","Quantity","Barcode"]],
body:rows,
theme:"grid",
styles:{fontSize:9,cellPadding:3},
headStyles:{fontStyle:"bold"},
columnStyles:{0:{cellWidth:12},1:{cellWidth:85},2:{cellWidth:25},3:{cellWidth:50}}
});

const blob=doc.output("blob");
const filename="Stock-Reorder-"+now.toISOString().slice(0,10)+".pdf";
const file=new File([blob],filename,{type:"application/pdf"});

if(navigator.canShare && navigator.canShare({files:[file]})){
await navigator.share({
title:"Stock Reorder List",
text:"Stock reorder list",
files:[file]
});
return;
}

const url=URL.createObjectURL(blob);
const a=document.createElement("a");
a.href=url;
a.download=filename;
document.body.appendChild(a);
a.click();
a.remove();
setTimeout(()=>URL.revokeObjectURL(url),10000);

const text="Stock reorder PDF has been generated. Please attach the downloaded PDF.";
window.open("https://wa.me/"+n+"?text="+encodeURIComponent(text),"_blank");
msg("PDF downloaded. Attach it in WhatsApp.","success");
}catch(e){
console.error(e);
msg("Could not create PDF: "+(e.message||"unknown error"),"error");
}
}

function saveSettings(){state.whatsapp=$("whatsappNumber").value.trim();localStorage.setItem("whatsappNumber",state.whatsapp);$("settingsStatus").textContent="Settings saved."}
function search(){const q=$("searchProduct").value.toLowerCase().trim();$("productResults").innerHTML=q?PRODUCTS.filter(p=>p.name.toLowerCase().includes(q)||p.barcode.includes(q)).slice(0,20).map(p=>`<div class="product search"><div><div class="product-name">${esc(p.name)}</div><div class="barcode">${p.barcode}</div></div><button class="primary" onclick="addProduct('${p.barcode}')">Add</button></div>`).join(""):""}
async function startCamera(){
  try{
    if(!window.isSecureContext){msg("Camera requires HTTPS. GitHub Pages uses HTTPS.","error");return}
    if(!window.ZXing){msg("Scanner library failed to load.","error");return}

    stopCamera();
    reader=new ZXing.BrowserMultiFormatReader();
    $("cameraStatus").textContent="Requesting camera permission...";
    $("startCamera").disabled=true;
    $("stopCamera").disabled=false;
    $("scanLine").style.display="block";

    const ds=await reader.listVideoInputDevices();
    if(!ds.length)throw Error("No camera found.");
    let id=ds[ds.length-1].deviceId;
    const rear=ds.find(d=>/back|rear|environment/i.test(d.label));
    if(rear)id=rear.deviceId;

    running=true;
    lastDetectedBarcode="";
    clearTimeout(unlockTimer);
    $("cameraStatus").textContent="Camera running — scan continuously. Press Stop Camera when finished.";

    reader.decodeFromVideoDevice(id,"video",(result)=>{
      if(!running)return;

      if(result){
        const barcode=String(result.getText()).trim();
        if(!barcode)return;

        // Add each barcode once while it remains in view. The lock is cleared
        // after the barcode disappears, allowing the same product to be scanned again.
        if(barcode!==lastDetectedBarcode){
          lastDetectedBarcode=barcode;
          addProduct(barcode);
        }

        clearTimeout(unlockTimer);
      }else{
        scheduleBarcodeUnlock();
      }
    });
  }catch(e){
    console.error(e);
    msg(e.message||"Camera error. Check permission.","error");
    stopCamera();
  }
}

function scheduleBarcodeUnlock(){
  clearTimeout(unlockTimer);
  unlockTimer=setTimeout(()=>{
    lastDetectedBarcode="";
  },800);
}

function stopCamera(){
  running=false;
  clearTimeout(unlockTimer);
  lastDetectedBarcode="";
  if(reader){try{reader.reset()}catch(e){}reader=null}
  const v=$("video");
  if(v.srcObject){v.srcObject.getTracks().forEach(t=>t.stop());v.srcObject=null}
  $("startCamera").disabled=false;
  $("stopCamera").disabled=true;
  $("scanLine").style.display="none";
  $("cameraStatus").textContent="Camera is stopped.";
}

$("startCamera").onclick=startCamera;$("stopCamera").onclick=stopCamera;$("addBarcode").onclick=()=>{addProduct($("barcodeInput").value);$("barcodeInput").value=""};$("barcodeInput").onkeydown=e=>{if(e.key==="Enter")$("addBarcode").click()};$("clearList").onclick=()=>{if(Object.keys(state.reorder).length&&confirm("Clear the entire reorder list?")){state.reorder={};save();render()}};$("sendWhatsApp").onclick=sendWhatsApp;$("saveSettings").onclick=saveSettings;$("searchProduct").oninput=search;$("whatsappNumber").value=state.whatsapp;render();