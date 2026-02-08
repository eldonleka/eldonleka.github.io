function startScan(context){
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        if(context==='import') document.getElementById('qr').value=decodedText;
        else if(context==='sale') document.getElementById('saleQR').value=decodedText;
        html5QrcodeScanner.clear();
    };
    const html5QrcodeScanner = new Html5Qrcode("qr-reader");
    html5QrcodeScanner.start({ facingMode: "environment" }, { fps:10, qrbox:250 }, qrCodeSuccessCallback);
}