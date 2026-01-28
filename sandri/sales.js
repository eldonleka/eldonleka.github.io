// Databaza e shitjeve
let sales = JSON.parse(localStorage.getItem("sales")) || [];

// Shitja e artikujve
function makeSale() {
    if(currentUser.role !== "admin") return alert("Access Denied");

    const nipt = prompt("Zgjidh klientin sipas NIPT:");
    const client = clients.find(c => c.nipt === nipt);
    if(!client) return alert("Klient jo i gjetur");

    let total = 0;
    let items = [];

    while(true){
        const code = prompt("Fut kodin e artikullit (ose shkruaj 'stop'):");
        if(code === "stop") break;

        const name = prompt("Emri i artikullit:");
        const price = parseFloat(prompt("Cmimi:"));
        const quantity = parseInt(prompt("Sasia:"));

        // zbrit stok automatik
        const product = inventory.find(p => p.code === code);
        if(!product) {
            alert("Artikull nuk ekziston ne stok!");
            continue;
        }
        if(product.quantity < quantity) {
            alert("Sasi e pamjaftueshme!");
            continue;
        }
        product.quantity -= quantity;

        items.push({ code, name, price, quantity });
        total += price * quantity;
    }

    const status = prompt("Paguar apo Me Borxh? (paguar/borxh)").toLowerCase();
    if(status === "borxh") {
        client.debt += total;
        client.payments.push({ amount: 0, date: new Date().toLocaleDateString() });
    }

    const sale = {
        clientNipt: nipt,
        items,
        total,
        status,
        date: new Date().toLocaleDateString()
    };

    sales.push(sale);
    saveSales();
    saveClients();
    alert("Shitja u regjistrua me sukses! Total: " + total + " €");
}

// Ruaj shitjet në localStorage
function saveSales() {
    localStorage.setItem("sales", JSON.stringify(sales));
}

// Shfaq shitjet (vetëm admin)
function showSales() {
    if(currentUser.role !== "admin") return alert("Access Denied");

    let html = "<h4>Shitjet:</h4><ul>";
    sales.forEach(s => {
        html += `<li>Klienti: ${s.clientNipt} | Total: ${s.total} € | Status: ${s.status} | Data: ${s.date}</li>`;
    });
    html += "</ul>";
    document.getElementById("sales").innerHTML = html;
}