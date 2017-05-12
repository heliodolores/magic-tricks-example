var cards = [];
var idCounter = 0;
var socket = null;
var serverURL = window.location.hostname + ":" +  window.location.port;
var tableId = window.location.search.substring(4);
var compassDiff = 0;
var compassDirection = 0;
var isCompassAttached = false; 

// on ready
document.addEventListener( 'DOMContentLoaded', function () {
    
    // init a deck of 10 cards
    init(10);

    // connect to websocket server
    socket = io.connect(serverURL);

    // register phone connection
    socket.emit('phone-connect', tableId);   

    // init touch events in phone
    var touchTrack = new TouchTrack();
    touchTrack.init(document.getElementById("touchHandler"), touchStart, touchMove, touchEnd);

    // Obtain a new *world-oriented* Full Tilt JS DeviceOrientation Promise
    var promise = FULLTILT.getDeviceOrientation({ 'type': 'world' });

    // Wait for Promise result
    promise.then(function(deviceOrientation) { // Device Orientation Events are supported

        // Register a callback to run every time a new 
        // deviceorientation event is fired by the browser.
        deviceOrientation.listen(function() {

            // Get the current *screen-adjusted* device orientation angles
            var currentOrientation = deviceOrientation.getScreenAdjustedEuler();

            // Calculate the current compass heading that the user is 'looking at' (in degrees)
            compassDirection = (180 - currentOrientation.alpha)*2;

        });

    }).catch(function(errorMessage) { // Device Orientation Events are not supported
        console.log(errorMessage);
    });

    // ... and update phone direction each 100 ms
    setInterval(function() {
        socket.emit("phone-move", { tableId: tableId, angle: getCompassDirection() });
    }, 100);

}, false);

// CARD FUNCTIONS

function addCard() {
    // adds a new card to the end of the deck
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
    // animates a card leaving the deck
    // after 500 ms removes the element from the DOM and informs the table
    if(cards.length === 0) {
        return;
    }
    var card = cards[0];
    cards.splice(0,1);
    setTimeout(function() {
        document.getElementById(id).parentElement.remove();
        addCard();
        socket.emit('phone-throw-card', { tableId: tableId,  suit: card.suit, rank: card.rank, angle: getCompassDirection(), strength: strength });
    }, 500);
}


// SWIPE EVENTS

function touchStart(x, y) {
  // do nothing
}

function touchMove(evt, x, y, offsetX, offsetY) {
    evt.preventDefault();
}

function touchEnd(x, y, offsetX, offsetY, timeTaken) {
    // 10 pixels swipe up = min threshold
    if(-offsetY < 10) {
        return;
    }
    // add class to animate
    var card = cards[0];
    var cardElement = document.getElementById(card.id);
    cardElement.classList += " move";

    // calculate strength (2000+ pixels per second = 100% strength)
    var distanceY = -offsetY;
    var pps = Math.trunc((distanceY*1.0) / (timeTaken/1000.0));
    var min = Math.min(2000, pps);
    var percentage = Math.trunc(min/2000*100);

    removeCard(card.id, percentage);
}

// RANDOM CARDS

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


// AUX

function init(n) {
    for(var i = 0; i < n; i++) {
        addCard();
    }
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function getCompassDirection() {
    var val = ((compassDirection - compassDiff) + 360) % 360;
    var direction = 0;
    if(val >= 0 && val < 180) {
        return Math.min(val, 90);    
    } else {
        return Math.max(val, 270);  
    }
}

function calibrate() {
    document.getElementById("touchHandler").className += " calibrated";
    document.getElementById("waiting-for-calibration").remove();
    compassDiff = compassDirection;
}