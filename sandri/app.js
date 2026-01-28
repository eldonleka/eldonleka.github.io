let data={products:[],clients:[],sales:[]};
let saleItems=[];
let masterPassword=localStorage.getItem('masterPassword');

// Master Password
function checkPassword(){ 
    let input=document.getElementById('masterPass').value;
    if(!masterPassword){ localStorage.setItem('masterPassword',input); masterPassword=input; alert("Master password created!"); showApp(); }
    else{ if(input===masterPassword) showApp(); else alert("Password gabim!"); }
}
function showApp(){ document.getElementById('passwordScreen').style.display='none'; document.getElementById('appScreen').style.display='block'; showSection('import'); }
function showSection(id){ ['import','sales','clients','inventory','backup'].forEach(s=>document.getElementById(s).style.display='none'); document.getElementById(id).style.display='block'; if(id==='sales') updateClientSelect(); }

// Inventory
function addProduct(){
    let qr=document.getElementById('qr').value, name=document.getElementById('prodName').value, qty=parseInt(document.getElementById('prodQty').value);
    if(!qr||!name||!qty){alert("Ploteso te gjitha!"); return;}
    let prod=data.products.find(p=>p.qr===qr);
    if(prod) prod.stock+=qty; else data.products.push({qr,name,stock:qty});
    updateInventory(); alert("Produkt shtuar!");
}
function updateInventory(){
    let t=document.getElementById('inventoryTable'); t.innerHTML='<tr><th>QR</th><th>Emri</th><th>Stock</th></tr>';
    data.products.forEach(p=>{ let r=t.insertRow(); r.insertCell(0).innerText=p.qr; r.insertCell(1).innerText=p.name; r.insertCell(2).innerText=p.stock; });
}

// Clients
function addClient(){
    let n=document.getElementById('clientName').value, a=document.getElementById('clientAddress').value, nipt=document.getElementById('clientNIPT').value, phone=document.getElementById('clientPhone').value;
    if(!n||!a||!nipt||!phone){alert("Ploteso te gjitha!"); return;}
    if(data.clients.find(c=>c.nipt===nipt)){alert("Klient ekziston!"); return;}
    data.clients.push({name:n,address:a,nipt:nipt,phone:phone});
    updateClientTable(); alert("Klient shtuar!");
}
function updateClientTable(){
    let t=document.getElementById('clientTable'); t.innerHTML='<tr><th>Emri</th><th>Adresa</th><th>NIPT</th><th>Telefon</th></tr>';
    data.clients.forEach(c=>{ let r=t.insertRow(); r.insertCell(0).innerText=c.name; r.insertCell(1).innerText=c.address; r.insertCell(2).innerText=c.nipt; r.insertCell(3).innerText=c.phone; });
}
function updateClientSelect(){
    let sel=document.getElementById('saleClient'); sel.innerHTML=''; data.clients.forEach(c=>{ let o=document.createElement('option'); o.value=c.nipt; o.innerText=c.name; sel.appendChild(o); });
}

// Sales
function addSaleItem(){
    let clientNIPT=document.getElementById('saleClient').value, qr=document.getElementById('saleQR').value, qty=parseInt(document.getElementById('saleQty').value), price=parseFloat(document.getElementById('salePrice').value);
    if(!qr||!qty||!price||!clientNIPT){alert("Ploteso te gjitha!"); return;}
    let prod=data.products.find(p=>p.qr===qr);
    if(!prod){alert("Produkt nuk ekziston!"); return;}
    if(qty>prod.stock){alert("Sasia tejkalon stokun!"); return;}
    saleItems.push({clientNIPT,qr,name:prod.name,qty,price});
    updateSaleTable();
}
function updateSaleTable(){
    let t=document.getElementById('saleTable'); t.innerHTML='<tr><th>QR</th><th>Emri</th><th>Sasi</th><th>Çmimi</th></tr>';
    saleItems.forEach(i=>{ let r=t.insertRow(); r.insertCell(0).innerText=i.qr; r.insertCell(1).innerText=i.name; r.insertCell(2).innerText=i.qty; r.insertCell(3).innerText=i.price; });
}
function completeSale(){
    if(saleItems.length===0){alert("Nuk ka artikuj!"); return;}
    let client=data.clients.find(c=>c.nipt===saleItems[0].clientNIPT);
    saleItems.forEach(i=>{ let prod=data.products.find(p=>p.qr===i.qr); prod.stock-=i.qty; data.sales.push({clientNIPT:i.clientNIPT,qr:i.qr,qty:i.qty,price:i.price,date:new Date().toISOString()}); });
    generatePDF(client); saleItems=[]; updateSaleTable(); updateInventory(); alert("Shitje kryer!");
}

// PDF
function generatePDF(client){
    const { jsPDF } = window.jspdf;
    let doc=new jsPDF();
    doc.setFontSize(16); doc.text("Faturë Shitjeje",20,20);
    doc.setFontSize(12); doc.text(`Klienti: ${client.name}`,20,30); doc.text(`Adresa: ${client.address}`,20,36); doc.text(`NIPT: ${client.nipt}`,20,42);
    let y=50; let total=0;
    saleItems.forEach(i=>{ doc.text(`${i.name} - ${i.qty} x ${i.price}€ = ${i.qty*i.price}€`,20,y); total+=i.qty*i.price; y+=6; });
    doc.text(`Total: ${total}€`,20,y+6); doc.save(`fature_${client.nipt}.pdf`);
}

// Export / Import
function exportData(){ let encrypted=CryptoJS.AES.encrypt(JSON.stringify(data),masterPassword).toString(); let blob=new Blob([encrypted],{type:"text/plain"}); let link=document.createElement("a"); link.download="inventory_backup.txt"; link.href=URL.createObjectURL(blob); link.click(); }
function importData(event){ let file=event.target.files[0]; if(!file)return; let reader=new FileReader(); reader.onload=function(e){ try{ let decrypted=CryptoJS.AES.decrypt(e.target.result,masterPassword).toString(CryptoJS.enc.Utf8); data=JSON.parse(decrypted); updateInventory(); updateClientTable(); alert("Import i kryer!"); }catch(err){alert("Password gabim ose file i korruptuar!");} }; reader.readAsText(file); }