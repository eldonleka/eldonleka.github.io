// current user
let currentUser = null;

// workers databaza (localStorage)
let workers = JSON.parse(localStorage.getItem("workers")) || [];

// Admin login
function adminLogin() {
    const pass = prompt("Fut Master Password:");
    if(pass === localStorage.getItem("master")){
        currentUser = { role: "admin" };
        enterApp();
    } else {
        alert("Password gabim!");
    }
}

// Worker login
function workerLogin() {
    const username = prompt("Username:");
    const password = prompt("Password:");
    const user = workers.find(w => w.username === username && w.password === password);
    if(user){
        currentUser = { role: "worker" };
        enterApp();
    } else {
        alert("Username ose password gabim!");
    }
}

// Enter App
function enterApp() {
    document.getElementById("welcome").classList.add("hidden");
    document.getElementById("login").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    setupMenu();
}

// Menu sipas role
function setupMenu() {
    const role = currentUser.role;
    const adminSections = ["inventory","sales","clients","reports","backup"];
    const workerSections = ["inventory"]; // zbritje stok + kontroll stok

    if(role === "worker"){
        document.querySelectorAll("section").forEach(sec => {
            if(!workerSections.includes(sec.id)){
                sec.style.display="none";
            }
        });
    }
}

// Logout
function logout() {
    currentUser = null;
    document.getElementById("app").classList.add("hidden");
    document.getElementById("login").classList.remove("hidden");
}