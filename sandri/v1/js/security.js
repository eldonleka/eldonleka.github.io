let masterPassword=localStorage.getItem("masterPassword")

function checkPassword(){
let p=masterPass.value
if(!masterPassword){
localStorage.setItem("masterPassword",p)
masterPassword=p
}
if(p===masterPassword){
passwordScreen.style.display="none"
appScreen.style.display="block"
loadLocal()
showSection("import")
}else alert("Gabim")
}