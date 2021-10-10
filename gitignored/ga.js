require("dotenv").config();
const ZenotiClient = require("../src/main");
const options = {
  handler: async (request, _h) => {
    const client = new ZenotiClient();
    const blockedOutTimes = await client.bookings.createGroupBooking({
      centerID: "2e70224d-a868-47a6-8e56-ff30e5b3668c",
      isOnlyCatalogEmployees: false,
      date: "2021-09-24",
      guestsData: [
        {
          serviceID: "7132f4a8-2fd4-483e-ab61-aedc36a2c761",
          userID: "fb99cb55-180b-417b-9f1b-78452ce6e92c",
          therapistID: "",
          addOnIDs: [],
          invoiceItemID: '132e084a-58c2-4d35-a252-0c0f2e4d466e',
          invoiceID: 'b9d75cbc-d655-4a54-86a6-57f94154e9b5',
        },
      ],
    });
    console.dir(blockedOutTimes,{showHidden: false, depth: null});
    const bookingId = blockedOutTimes.id;
    const slots = await client.bookings.getSlots(bookingId);
    console.dir(slots,{showHidden: false, depth: null});
    const reserve = await client.bookings.reserveSlot(bookingId, '2021-09-24T17:00:00');
    console.dir(reserve,{showHidden: false, depth: null});
    const confirm = await client.bookings.confirmBooking(bookingId,null,'group');
    console.dir(confirm,{confirm: false, depth: null});

  },
};
(async () => {
  try {
    await options.handler();
  } catch (err) {
    console.error(err);
  }
})();