function addSaleItem(){
let p=data.products.find(x=>x.qr===saleQR.value)
if(!p) return alert("Nuk ekziston")

p.stock-=parseInt(saleQty.value)

saleItems.push({
name:p.name,
qty:saleQty.value,
price:salePrice.value
})

saveLocal()
updateSaleTable()
}

function updateSaleTable(){
saleTable.innerHTML="<tr><th>Emri</th><th>Sasi</th><th>Çmimi</th></tr>"
saleItems.forEach(i=>{
saleTable.innerHTML+=`<tr><td>${i.name}</td><td>${i.qty}</td><td>${i.price}</td></tr>`
})
}

function completeSale(){
const {jsPDF}=window.jspdf
let d=new jsPDF()
let y=20,total=0
saleItems.forEach(i=>{
d.text(`${i.name} ${i.qty} x ${i.price}`,10,y)
total+=i.qty*i.price
y+=7
})
d.text("TOTAL "+total,10,y+10)
d.save("fature.pdf")
saleItems=[]
}