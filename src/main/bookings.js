const Rest = require("./helper/rest");

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
    return await this.post("/v1/bookings", {}, data);
  }

  /**
   * @name getSlots
   * @param {String} bookingId
   */
  async getSlots(bookingId) {
    return await this.get(`/v1/bookings/${bookingId}/slots`);
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

  async confirmBooking(bookingId, notes) {
    return await this.post(
      `/v1/bookings/${bookingId}/slots/confirm`,
      {},
      { notes }
    );
  }

  async cancelBooking(invoiceId, comments) {
    return await this.put(`/v1/invoices/${invoiceId}/cancel`, {}, { comments });
  }
}

module.exports = Bookings;
