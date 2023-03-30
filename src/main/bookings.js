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
    invoice_id = null,
    invoice_item_id = null,
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
    if (invoice_id) {
      data.guests[0].invoice_id = invoice_id;
    }
    if (invoice_item_id) {
      data.guests[0].items[0].invoice_item_id = invoice_item_id;
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

  async checkIn(appointmentGroupId) {
    return await this.put(`/v1/appointments/${appointmentGroupId}/check_in`);
  }

  /**
   * Get appointment by id
   *
   * @param {String} id Uuid
   */
  async getAppointment(id) {
    return await this.get(`/v1/appointments/${id}`, {});
  }

  async getAppointmentsOfCenter({
    center_id,
    start_date,
    end_date,
    include_no_show_cancel = false,
  }) {
    return await this.get(`/v1/appointments`, {
      center_id,
      start_date,
      end_date,
      include_no_show_cancel,
    });
  }
}

module.exports = Bookings;
