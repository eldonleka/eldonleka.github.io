function addProduct(){
let qrVal=qr.value
let name=prodName.value
let qty=parseInt(prodQty.value)

let p=data.products.find(x=>x.qr===qrVal)
if(p) p.stock+=qty
else data.products.push({qr:qrVal,name,stock:qty})

saveLocal()
updateInventory()
}

function updateInventory(){
inventoryTable.innerHTML="<tr><th>QR</th><th>Emri</th><th>Stock</th></tr>"
data.products.forEach(p=>{
inventoryTable.innerHTML+=`<tr><td>${p.qr}</td><td>${p.name}</td><td>${p.stock}</td></tr>`
})
}