let qrScanner = null;

// Start QR Scan
function startQR() {
    if (!qrScanner) {
        qrScanner = new Html5Qrcode("qr-reader");
    }

    Html5Qrcode.getCameras().then(cameras => {
        if (cameras && cameras.length) {
            qrScanner.start(
                cameras[0].id,
                { fps: 10, qrbox: 250 },
                qrCodeMessage => {
                    document.getElementById("qr-result").innerText = qrCodeMessage;
                    handleScannedCode(qrCodeMessage);
                    stopQR();
                },
                error => {}
            );
        }
    }).catch(err => {
        alert("Nuk u gjet kamera");
    });
}

// Stop QR Scan
function stopQR() {
    if (qrScanner) {
        qrScanner.stop().then(() => {
            qrScanner.clear();
        });
    }
}

// Çfarë bëjmë me kodin e skanuar
function handleScannedCode(code) {
    // këtu e lidhim me inventory ose sales
    console.log("Kodi i skanuar:", code);

    // shembull: vendose automatikisht në input
    const input = document.getElementById("productCode");
    if (input) input.value = code;
}