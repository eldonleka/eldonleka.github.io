/* ================= DATABASE ================= */
let db, scanTarget = null, stream = null;

const req = indexedDB.open("toyshop", 2);

req.onupgradeneeded = e => {
  db = e.target.result;
  db.createObjectStore("meta", { keyPath: "key" });
  db.createObjectStore("products", { keyPath: "id", autoIncrement: true });
  db.createObjectStore("sales", { keyPath: "id", autoIncrement: true });
  db.createObjectStore("clients", { keyPath: "id", autoIncrement: true });
};

req.onsuccess = e => {
  db = e.target.result;
  checkInit();
};

function tx(s, m = "readonly") {
  return db.transaction(s, m).objectStore(s);
}

function hash(s) {
  return btoa(s);
}

/* ================= AUTH ================= */
function checkInit() {
  tx("meta").get("pw").onsuccess = e => {
    e.target.result
      ? loginBox.style.display = "block"
      : setupBox.style.display = "block";
  };
}

function createMaster() {
  if (!newpw.value) return alert("Password required");
  tx("meta", "readwrite").put({ key: "pw", val: hash(newpw.value) });
  setupBox.style.display = "none";
  loginBox.style.display = "block";
}

function login() {
  tx("meta").get("pw").onsuccess = e => {
    if (hash(pw.value) === e.target.result.val) {
      loginBox.style.display = "none";
      app.style.display = "block";
      loadAll();
    } else alert("Wrong password");
  };
}

/* ================= NAV ================= */
function show(id) {
  document.querySelectorAll(".view").forEach(v => v.style.display = "none");
  document.getElementById(id).style.display = "block";
}

/* ================= PRODUCTS ================= */
function stockExists(stock, cb) {
  tx("products").getAll().onsuccess = e =>
    cb(e.target.result.some(p => p.stockId === stock));
}

function addProduct() {
  let stock = pstock.value.trim();
  if (!stock) return alert("Stock ID required");

  stockExists(stock, exists => {
    if (exists) return alert("Stock ID already exists");

    tx("products", "readwrite").add({
      stockId: stock,
      name: pname.value,
      price: +pprice.value,
      vat: +pvat.value,
      qty: +pqty.value
    });

    loadProducts();
  });
}

function loadProducts() {
  let t = "<tr><th>Stock</th><th>Name</th><th>Price</th><th>VAT</th><th>Qty</th></tr>";
  saleProduct.innerHTML = "";

  tx("products").getAll().onsuccess = e => {
    e.target.result.forEach(p => {
      t += `<tr><td>${p.stockId}</td><td>${p.name}</td><td>${p.price}</td><td>${p.vat}%</td><td>${p.qty}</td></tr>`;
      saleProduct.innerHTML += `<option value="${p.id}">${p.name}</option>`;
    });
    ptable.innerHTML = t;
  };
}

/* ================= CLIENTS ================= */
function addClient() {
  tx("clients", "readwrite").add({ name: cname.value, phone: cphone.value, debt: 0 });
  loadClients();
}

function loadClients() {
  let t = "<tr><th>Name</th><th>Phone</th><th>Debt</th></tr>";
  saleClient.innerHTML = "<option value=''>Cash Sale</option>";

  tx("clients").getAll().onsuccess = e => {
    e.target.result.forEach(c => {
      t += `<tr><td>${c.name}</td><td>${c.phone}</td><td>${c.debt.toFixed(2)}</td></tr>`;
      saleClient.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });
    ctable.innerHTML = t;
  };
}

/* ================= SALES ================= */
function autoSelect(stock) {
  tx("products").getAll().onsuccess = e => {
    let p = e.target.result.find(x => x.stockId === stock);
    if (p) {
      saleProduct.value = p.id;
      saleQty.value = saleQty.value || 1;
    } else alert("Product not found");
  };
}

function makeSale() {
  let qty = +saleQty.value;
  let qr = saleQR.value.trim();

  if (qr) {
    tx("products").getAll().onsuccess = e => {
      let p = e.target.result.find(x => x.stockId === qr);
      if (!p) return alert("Product not found");
      processSale(p, qty);
    };
  } else {
    tx("products", "readwrite").get(+saleProduct.value)
      .onsuccess = e => processSale(e.target.result, qty);
  }
}

function processSale(p, qty) {
  if (p.qty < qty) return alert("No stock");

  p.qty -= qty;
  tx("products", "readwrite").put(p);

  let vat = p.price * qty * (p.vat / 100);
  let total = p.price * qty + vat;

  tx("sales", "readwrite").add({
    date: new Date().toISOString(),
    product: p.name,
    stockId: p.stockId,
    qty,
    total,
    vat
  });

  if (saleDebt.checked && saleClient.value) {
    tx("clients", "readwrite").get(+saleClient.value).onsuccess = c => {
      let cl = c.target.result;
      cl.debt += total;
      tx("clients", "readwrite").put(cl);
    };
  }

  loadAll();
}

function loadSales() {
  let t = "<tr><th>Date</th><th>Product</th><th>Stock</th><th>Qty</th><th>Total</th></tr>";
  tx("sales").getAll().onsuccess = e => {
    e.target.result.forEach(s => {
      t += `<tr><td>${s.date}</td><td>${s.product}</td><td>${s.stockId}</td><td>${s.qty}</td><td>${s.total.toFixed(2)}</td></tr>`;
    });
    stable.innerHTML = t;
  };
}

function loadAll() {
  loadProducts();
  loadClients();
  loadSales();
}

/* ================= BACKUP / RESTORE ================= */
function backup() {
  let dump = {}, stores = ["meta", "products", "sales", "clients"], left = stores.length;
  stores.forEach(s =>
    tx(s).getAll().onsuccess = e => {
      dump[s] = e.target.result;
      if (--left === 0) {
        let a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([JSON.stringify(dump)], { type: "application/json" }));
        a.download = "toyshop-backup.json";
        a.click();
      }
    }
  );
}

function restore(ev) {
  let r = new FileReader();
  r.onload = () => {
    let d = JSON.parse(r.result);
    Object.keys(d).forEach(s => d[s].forEach(x => tx(s, "readwrite").put(x)));
    alert("Reload page");
  };
  r.readAsText(ev.target.files[0]);
}

/* ================= SCANNER ================= */
function beep() {
  new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=").play();
}

async function startScan(target) {
  if (!("BarcodeDetector" in window)) return alert("Scanner not supported");
  scanTarget = target;

  const detector = new BarcodeDetector({ formats: ["qr_code", "ean_13", "code_128", "upc_a"] });
  scanner.style.display = "flex";

  stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
  video.srcObject = stream;

  const loop = async () => {
    if (!stream) return;
    let codes = await detector.detect(video);
    if (codes.length) {
      let val = codes[0].rawValue;
      document.getElementById(scanTarget).value = val;
      beep();
      if (scanTarget === "saleQR") autoSelect(val);
      stopScan();
    } else requestAnimationFrame(loop);
  };
  loop();
}

function stopScan() {
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null;
  scanner.style.display = "none";
}