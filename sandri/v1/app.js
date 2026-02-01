let db = {
    stock: [],
    clients: [],
    sales: []
};

let masterPassword = null;

// --- Login ---
document.getElementById("login-btn").addEventListener("click", () => {
    const pass = document.getElementById("master-password").value;
    if (!masterPassword) {
        masterPassword = pass;
        alert("Master password created!");
    } else if (pass === masterPassword) {
        document.getElementById("login-screen").style.display = "none";
        document.getElementById("app-screen").style.display = "block";
        renderStock();
        renderClients();
    } else {
        alert("Wrong password!");
    }
});

// --- Stock Management ---
document.getElementById("add-stock-btn").addEventListener("click", () => {
    const id = document.getElementById("product-id").value;
    const name = document.getElementById("product-name").value;
    const qty = parseInt(document.getElementById("qty").value);

    if (!id || !name || !qty) { alert("Fill all fields!"); return; }

    const existing = db.stock.find(p => p.id === id);
    if (existing) {
        existing.qty += qty;
    } else {
        db.stock.push({id, name, qty, dateAdded: new Date().toLocaleDateString()});
    }

    renderStock();
});

// --- Render Stock ---
function renderStock() {
    const tbody = document.querySelector("#stock-table tbody");
    tbody.innerHTML = "";
    db.stock.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${p.id}</td><td>${p.name}</td><td>${p.qty}</td><td>${p.dateAdded}</td>`;
        tbody.appendChild(tr);
    });
}

// --- Clients ---
document.getElementById("add-client-btn").addEventListener("click", () => {
    const name = document.getElementById("client-name").value;
    if (!name) return;
    db.clients.push({name, sales: []});
    document.getElementById("client-name").value = "";
    renderClients();
});

function renderClients() {
    const tbody = document.querySelector("#clients-table tbody");
    const select = document.getElementById("client-select");
    tbody.innerHTML = "";
    select.innerHTML = "";

    db.clients.forEach(c => {
        const total = c.sales.reduce((a,b)=>a+b.price*b.qty,0);
        const paid = c.sales.filter(s=>s.status==="paid").reduce((a,b)=>a+b.price*b.qty,0);
        const unpaid = total - paid;

        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${c.name}</td><td>${total}</td><td>${paid}</td><td>${unpaid}</td>`;
        tbody.appendChild(tr);

        const opt = document.createElement("option");
        opt.value = c.name;
        opt.textContent = c.name;
        select.appendChild(opt);
    });
}

// --- Sales ---
document.getElementById("make-sale-btn").addEventListener("click", () => {
    const clientName = document.getElementById("client-select").value;
    const productId = document.getElementById("sale-product-id").value;
    const qty = parseInt(document.getElementById("sale-qty").value);
    const price = parseFloat(document.getElementById("sale-price").value);
    const status = document.getElementById("sale-status").value;

    if (!clientName || !productId || !qty || !price) { alert("Fill all fields!"); return; }

    const client = db.clients.find(c=>c.name===clientName);
    client.sales.push({productId, qty, price, status});
    renderClients();
});

// --- Import/Export DB ---
document.getElementById("export-db-btn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(db,null,2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "database.json"; a.click();
});

document.getElementById("import-db").addEventListener("change", (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function(event){
        db = JSON.parse(event.target.result);
        renderStock();
        renderClients();
    }
    reader.readAsText(file);
});