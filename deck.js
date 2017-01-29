var cards = [];
var idCounter = 0;
var socket = null;
var serverURL = window.location.hostname + ":" +  window.location.port;
var sessionGuid = window.location.search.substring(6);
var compassDiscount = 0;
var compassDir = 0;
var compassAttached = false; 

// On page ready
document.addEventListener( 'DOMContentLoaded', function () {
    
    // init deck with 10 cards
    init(10);

    // connect to websocket server
    socket = io.connect(serverURL);
    socket.emit('phone-connect', sessionGuid);   

    // init touch events
    var elem = document.getElementById("touchHandler");
    var touchTrack = new TouchTrack();
    touchTrack.init(elem, touchStart, touchMove, touchEnd);

    // init compass data
    if(!compassAttached) {
        if (window.DeviceOrientationEvent) {
          // Listen for the deviceorientation event and handle the raw data

          window.addEventListener('deviceorientation', function(event) {

            if(event.webkitCompassHeading) {
              // Apple works only with this, alpha doesn't work
              compassDir = event.webkitCompassHeading;  
            }
            else compassDir = event.alpha;
          });
        }
        compassAttached = true;
    }

    setInterval(function() {
        socket.emit("phone-move", { guid: sessionGuid, angle: getCompassDirection() });
    }, 500);

}, false );



// functions

function init(n) {
    for(var i = 0; i < n; i++) {
        addCard();
    }
}

function addCard() {

    var randomCard = getRandomCard();
    var card = {
      "id": "card" + idCounter ++,
      "suit": randomCard.suit,
      "rank": randomCard.rank
    };
    cards.push(card);
    
    document.getElementById("touchHandler").innerHTML += 
        `<div class="item">
            <div id="${card.id}" class="card ${card.suit} rank${card.rank}">
                <div class="face"/>
            </div>
        </div>`;
}

function removeCard(id, strength) {
    if(cards.length === 0) {
      return;
    }
    var card = cards[0];
    cards.splice(0,1);
    setTimeout(function() {
        document.getElementById(id).parentElement.remove();
        addCard();

        var direction = getCompassDirection();
        socket.emit('phone-throw-card', { guid: sessionGuid,  suit: card.suit, rank: card.rank, angle: direction, strength: strength });
    }, 500);
}


// handle user swipe moves

function touchStart(x, y) {
  // do nothing
}

function touchMove(evt, x, y, offsetX, offsetY) {
    evt.preventDefault();
}

function touchEnd(x, y, offsetX, offsetY, timeTaken) {
    if(-offsetY < 10) {
        return;
    }
    var card = cards[0];
    var cardElement = document.getElementById(card.id);
    cardElement.classList += " move";

    // calculate strength (percentage to 2000 pps)
    var distanceY = -offsetY;
    var pixelsPerSecond = Math.trunc((distanceY*1.0) / (timeTaken/1000.0));
    var min = Math.min(2000, pixelsPerSecond);
    var percentage = Math.trunc(min/2000*100);

    removeCard(card.id, percentage);
}

// random card generators

function getRandomCard() {
    return { 
        suit: getRandomSuit(), 
        rank: getRandomNumber(1, 13)
    }
}

function getRandomSuit() {
    var suits = ["hearts", "spades", "clubs", "diamonds"];
    return suits[getRandomNumber(0, 3)];
}



// aux

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function getCompassDirection() {
   var val = ((compassDir - compassDiscount) + 360) % 360;
    var direction = 0;
    if(val >= 0 && val < 180) {
        return Math.min(val, 90);    
    } else {
        return Math.max(val, 270);  
    }
}

function calibrate() {
    document.getElementById("touchHandler").className += " calibrated";
    document.getElementsByClassName("waiting-for-calibration")[0].remove();
    compassDiscount = compassDir;
}