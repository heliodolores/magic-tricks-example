// CHANGE THE SERVER URL
var serverURL = "192.168.1.111:8080";
var sessionGuid = generateUUID();
var idCounter = 0;

// connect to websocket server
var socket = io.connect(serverURL);

// register card table socket right after the connection is established
socket.emit('table-connect', sessionGuid);

// call callback when phone moves
socket.on('phone-move', phoneMoved);

// call callback when a card arrives
socket.on('phone-throw-card', throwCard);

// call callback when phone connects
socket.on('phone-connect', phoneConnected);

function phoneMoved(angle) {
    var path = document.querySelector(".path.phone");
    path.style = `transform: rotate(${angle}deg)`;
}

function throwCard(card) {
    console.log("received " + card);
    // add card to table
    var cardid = "card" + idCounter++;
    addCard(cardid, card.angle, card.suit, card.rank);    

    // little hack to trigger the animation
    setTimeout(function () {
        var cardElement = document.getElementById(cardid);
        // add 'thrown' class to start animation
        cardElement.className += " thrown";
        // set thrown strength
        cardElement.style = "transform: translateY(" + (100 - card.strength) + "vh) scale(1)";
    }, 100);
}

function phoneConnected() {
    document.getElementById("waiting-for-device").remove();
}

function addCard(id, angle, suit, rank) {
    document.body.innerHTML += 
        `<div class="path" style="transform: rotate(${angle}deg)">
            <div id="${id}" class="card ${suit} rank${rank}">
                <div class="face"/>
            </div>
        </div>`;
}

document.addEventListener( 'DOMContentLoaded', function () {
    // on ready set the qr code
    qrCodeGenerator("http://" + serverURL + "/?guid=" + sessionGuid, "placeholder");
}, false );

function qrCodeGenerator(value, elementid) {
    var qr = qrcode(4, 'L');
    qr.addData(value);
    qr.make();
    document.getElementById(elementid).innerHTML = qr.createImgTag(3,12);
}

function generateUUID(){
    var d = new Date().getTime();
    if(window.performance && typeof window.performance.now === "function"){
        d += performance.now(); //use high-precision timer if available
    }
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}