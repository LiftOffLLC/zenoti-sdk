const Rest = require('./helper/rest');

class Bookings extends Rest {
  /**
   * @name createBooking
   * @param {Object} params
   */
  async createBooking(params) {
    return await this.post('/v1/bookings', {}, params);
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
      { slot_time: slotTime },
    );
  }

  async confirmBooking(bookingId, notes) {
    return await this.post(
      `/v1/bookings/${bookingId}/slots/confirm`,
      {},
      { notes },
    );
  }
}

module.exports = Bookings;
