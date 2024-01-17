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
      date,
      is_only_catalog_employees: isOnlyCatalogEmployees,
      guests: [],
    };
  
    for (const guestData of guestsData) {
      const serviceAddOnIdMap = guestData.serviceAddOnIdMap ? guestData.serviceAddOnIdMap : {};
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
            therapist: {
              id: guestData.batherID ? guestData.batherID : '',
            },
            add_ons: addOns.length > 0 ? addOns : null,
          },
        ],
      };

      if(guestData.invoiceID){
        guest.invoice_id = guestData.invoiceID
      }

      if(guestData.invoiceItemID){
        guest.items[0].invoice_item_id = guestData.invoiceItemID
      }
  
      if (guestData.serviceAddOnIDs && guestData.serviceAddOnIDs.length > 0) {
        for (const serviceAddOnId of guestData.serviceAddOnIDs) {
          const invoice_item_id = serviceAddOnIdMap[serviceAddOnId]
          guest.items.push({
            item: {
              id: serviceAddOnId,
            },
            therapist: {
              id: guestData.groomerID
                ? guestData.groomerID
                : '',
            },
            ...(invoice_item_id && { invoice_item_id})
          });
        }
      }
  
      data.guests.push(guest);
    }
  
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
  /**
   * Get appointments of center based on dates
   * @param {String} centerId Uuid
   * @param {String} startDate Date
   * @param {String} endDate Date
   */
  async getAppointments(centerId, startDate, endDate) {
    return await this.get(
      `/v1/appointments?center_id=${centerId}&start_date=${startDate}&end_date=${endDate}&include_no_show_cancel=true`
    );
  }

    /**
   * Delete appointment
   * @param {String} invoiceId Uuid
   * @param {String} itemId invoiceItemId
   * @param {String} comments comments
   */
  async deleteBooking({ invoiceId, itemId, comments }) {
    return await this.delete(
      `/v1/invoices/${invoiceId}/invoiceitems/${itemId}`,
      {},
      {
        comments,
      },
      true
    );
  }
}

module.exports = Bookings;
