// Databaza e klientëve (ruhet në localStorage)
let clients = JSON.parse(localStorage.getItem("clients")) || [];

// Shto klient të ri (vetëm admin)
function addClient() {
    if(currentUser.role !== "admin") return alert("Access Denied");

    const name = prompt("Emri i klientit:");
    const nipt = prompt("NIPT i klientit:");

    if(clients.find(c => c.nipt === nipt)) {
        alert("Klient me këtë NIPT ekziston!");
        return;
    }

    const newClient = { name, nipt, debt: 0, payments: [] };
    clients.push(newClient);
    saveClients();
    alert("Klient shtuar me sukses!");
}

// Regjistro pagesë për borxhin e klientit
function registerPayment(nipt, amount) {
    if(currentUser.role !== "admin") return alert("Access Denied");

    const client = clients.find(c => c.nipt === nipt);
    if(!client) return alert("Klient jo i gjetur");

    if(amount > client.debt) amount = client.debt; // nuk mund të paguhet më shumë se borxhi
    client.debt -= amount;
    client.payments.push({ amount, date: new Date().toLocaleDateString() });
    saveClients();
    alert("Pagesa regjistruar. Borxhi i ri: " + client.debt + " €");
}

// Shfaq listën e klientëve + borxhe
function showClients() {
    if(currentUser.role !== "admin") return alert("Access Denied");

    let html = "<h4>Klientët dhe borxhet:</h4><ul>";
    clients.forEach(c => {
        html += `<li>${c.name} | NIPT: ${c.nipt} | Borxh: ${c.debt} €</li>`;
    });
    html += "</ul>";
    document.getElementById("clients").innerHTML = html;
}

// Ruaj në localStorage
function saveClients() {
    localStorage.setItem("clients", JSON.stringify(clients));
}