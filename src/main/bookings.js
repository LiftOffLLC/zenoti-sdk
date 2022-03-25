const Rest = require("./helper/rest");
const _ = require("lodash");

class Bookings extends Rest {
  /**
   * @name createBooking
   * @param {Object} data
   */
  async createBooking({
    centerID,
    serviceID,
    userID,
    therapistID,
    isOnlyCatalogEmployees,
    date,
    addOnIDs = [],
  }) {
    const data = {
      center_id: centerID,
      is_only_catalog_employees: isOnlyCatalogEmployees,
      date,
      guests: [
        {
          id: userID,
          items: [
            {
              item: {
                id: serviceID,
              },
              therapist: { id: therapistID },
            },
          ],
        },
      ],
    };
    if (addOnIDs.length > 0) {
      const addOns = [];
      for (const addOnID of addOnIDs) {
        addOns.push({
          item: {
            id: addOnID,
          },
        });
      }
      data.guests[0].items[0].add_ons = addOns;
    }
    return await this.post("/v1/bookings", {}, data);
  }

  async createGroupBooking({
    centerID,
    date,
    guestsData,
    isOnlyCatalogEmployees,
  }) {
    const data = {
      center_id: centerID,
      is_only_catalog_employees: isOnlyCatalogEmployees,
      date,
    };
    const guests = [];
    for (const guestData of guestsData) {
      const addOns = [];
      if (guestData.addOnIDs.length > 0) {
        for (const addOnID of guestData.addOnIDs) {
          addOns.push({
            item: {
              id: addOnID,
            },
          });
        }
      }
      const guest = {
        id: guestData.userID,
        items: [
          {
            item: {
              id: guestData.serviceID,
            },
            therapist: { id: guestData.therapistID },
            add_ons: addOns,
          },
        ],
      };
      if (guestData.invoiceID && guestData.invoiceItemID) {
        guest.invoice_id = guestData.invoiceID;
        guest.items[0].invoice_item_id = guestData.invoiceItemID;
      }
      if (guestData.serviceAddOnIDs && guestData.serviceAddOnIDs.length > 0) {
        for (const serviceAddOnId of guestData.serviceAddOnIDs) {
          guest.items.push({
            item: {
              id: serviceAddOnId,
            },
            therapist: { id: guestData.therapistID },
          });
        }
      }
      guests.push(guest);
    }
    data.guests = guests;
    return await this.post("/v1/bookings", {}, data);
  }

  /**
   * @name getSlots
   * @param {String} bookingId
   */
  async getSlots(bookingId, options) {
    const futureDays = _.get(options, "query.futureDays", false);
    return await this.get(
      `/v1/bookings/${bookingId}/slots?check_future_day_availability=${futureDays}`
    );
  }

  /**
   * @name reserveSlot
   * @param {String} bookingId
   * @param {DateTime} slotTime
   */
  async reserveSlot(bookingId, slotTime) {
    return await this.post(
      `/v1/bookings/${bookingId}/slots/reserve`,
      {},
      { slot_time: slotTime }
    );
  }

  async confirmBooking(bookingId, notes, groupName) {
    return await this.post(
      `/v1/bookings/${bookingId}/slots/confirm`,
      {},
      { notes, group_name: groupName },
      true
    );
  }

  async cancelBooking(invoiceId, comments) {
    return await this.put(`/v1/invoices/${invoiceId}/cancel`, {}, { comments });
  }

  /**
   * Mark appointment as no-show
   *
   * @param {String} appointmentGroupId uuid of zenoti reference
   * @param {String} comments some notes ( required )
   */
  async noShow({ appointmentGroupId, comments }) {
    return await this.put(
      `/v1/appointments/${appointmentGroupId}/no_show`,
      {},
      { comments }
    );
  }

  /**
   * Get appointment by id
   *
   * @param {String} id Uuid
   */
  async getAppointment(id) {
    return await this.get(`/v1/appointments/${id}`, {}, true);
  }

  /**
   * Check In appointment
   *
   * @param {String} id Uuid
   */
  async checkIn(appointmentGroupId) {
    return await this.put(`/v1/appointments/${appointmentGroupId}/check_in`);
  }
}

module.exports = Bookings;
