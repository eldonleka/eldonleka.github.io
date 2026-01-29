let data = {products:[],clients:[],sales:[]}
let saleItems=[]

function showSection(id){
document.querySelectorAll("section").forEach(s=>s.style.display="none")
document.getElementById(id).style.display="block"
if(id==="inventory") updateInventory()
if(id==="sales") updateClientSelect()
}

function saveLocal(){
localStorage.setItem("db",JSON.stringify(data))
}

function loadLocal(){
let d=localStorage.getItem("db")
if(d) data=JSON.parse(d)
}