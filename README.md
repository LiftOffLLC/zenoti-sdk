# zenoti-sdk
NodeJS wrapper around Zenoti APIs

## Installation
```shell
> yarn add git+https://token:x-oauth-basic@github.com/LiftOffLLC/zenoti-sdk.git#master

or

> npm install --save git+https://token:x-oauth-basic@github.com/LiftOffLLC/zenoti-sdk.git#master
```

## Enviroment Setup
In your .env file add the below environment variables
```javascript
ZENOTI_AUTH_STRATEGY=API_KEY
ZENOTI_API_KEY=********************************
```

## Sample Code
```javascript
// import the module
const ZenotiClient = require("@liftoffllc/zenoti");

// initialize the ZenotiClient
const client = new ZenotiClient();

// call method, Here fetching all centers
client.centers.fetch()
  .then(data => console.log(data))
  .catch(err => console.log(err.message));
```

## Usage
```javascript
// import module
const ZenotiClient = require("@liftoffllc/zenoti");

// initialize zenoti client
const client = new ZenotiClient();

// Centers
client.centers.fetch() // get all centers

// Guests
const params = {};
client.guests.createGuest(params) // create new zenoti user

// Bookings
const params = {
    centerID: "c07c82cc-a5f9-4d9d-ad64-d89a3acfe3aa",
    isOnlyCatalogEmployees: false,
    date: "2020-03-15",
    userID: "4c6b1d06-c2b5-4143-a77f-c1936fe72b69",
    serviceID: "3199d02a-165a-40a1-b601-690c261c1a81",
    therapistID: ""
};
client.bookings.createBooking(params); // create booking
client.bookings.getSlots(bookingID) // get slots by booking id
client.bookings.reserveSlot(bookingID, slotTime); // reserve booking id against slot time
client.bookings.confirmBooking(bookingID, notes) // config booking slot


// services
client.services
  .fetch({ centerID: "c07c82cc-a5f9-4d9d-ad64-d89a3acfe3aa" }) // fetch sevices by center or location id

```
** Note : This section needs to be updated as adding more features.

## Docs Links
- [Zenoti REST API DOCS](https://docs.zenoti.com/?version=latest "Zenoti REST API DOCS")