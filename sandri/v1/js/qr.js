const scanner=new Html5Qrcode("qr-reader")

scanner.start({facingMode:"environment"},{fps:10,qrbox:250},
txt=>{
if(import.style.display==="block") qr.value=txt
if(sales.style.display==="block") saleQR.value=txt
})