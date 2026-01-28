// Shfaq raport stok (për admin)
function showStockReport() {
    if(currentUser.role !== "admin") return alert("Access Denied");

    let html = "<h4>Raporti i Stokut:</h4><table border='1' cellpadding='5'><tr><th>Kod</th><th>Emër</th><th>Sasi</th></tr>";
    inventory.forEach(item => {
        html += `<tr><td>${item.code}</td><td>${item.name}</td><td>${item.quantity}</td></tr>`;
    });
    html += "</table>";
    document.getElementById("reports").innerHTML = html;
}

// Shfaq raport shitjesh (për admin)
function showSalesReport() {
    if(currentUser.role !== "admin") return alert("Access Denied");

    let html = "<h4>Raporti i Shitjeve:</h4><table border='1' cellpadding='5'><tr><th>Klient</th><th>Total</th><th>Status</th><th>Data</th></tr>";
    sales.forEach(sale => {
        html += `<tr><td>${sale.clientNipt}</td><td>${sale.total} €</td><td>${sale.status}</td><td>${sale.date}</td></tr>`;
    });
    html += "</table>";
    document.getElementById("reports").innerHTML = html;
}

// Shfaq raport borxhe (vetëm klientët me borxh)
function showDebtReport() {
    if(currentUser.role !== "admin") return alert("Access Denied");

    let html = "<h4>Raporti i Borxheve:</h4><table border='1' cellpadding='5'><tr><th>Klient</th><th>NIPT</th><th>Borxh</th></tr>";
    clients.filter(c => c.debt > 0).forEach(c => {
        html += `<tr><td>${c.name}</td><td>${c.nipt}</td><td>${c.debt} €</td></tr>`;
    });
    html += "</table>";
    document.getElementById("reports").innerHTML = html;
}