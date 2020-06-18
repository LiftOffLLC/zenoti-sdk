const Rest = require("./helper/rest");

class Guests extends Rest {
  /**
   * @name createGuest
   * @param {Object} params
   * @param {string} params.center_id
   * @param {string} params.code
   * @param {Object} params.personal_info
   * @param {string} params.personal_info.first_name
   * @param {string} params.personal_info.last_name
   * @param {string} params.personal_info.middle_name
   * @param {Object} params.personal_info.mobile_phone
   * @param {string} params.personal_info.email
   */
  async createGuest(params) {
    return await this.post("/v1/guests", {}, params);
  }

  /**
   *
   * @param {String} param0.guestId Guest user uuid
   * @param {String} param0.centerId Location/center uuid
   * @param {String} param0.redirectURL Url to redirect after adding card
   * @param {Boolean} param0.shareCardsToWeb
   * @param {String} param0.protocol https or http
   */
  async addCard({ guestId, centerId, redirectURL, shareCardsToWeb, protocol }) {
    return await this.post(
      `/v1/guests/${guestId}/accounts`,
      {},
      {
        center_id: centerId,
        redirect_uri: redirectURL,
        share_cards_to_web: shareCardsToWeb,
        protocol,
      }
    );
  }

  async getCards({ guestId, centerId }) {
    return await this.get(
      `/v1/guests/${guestId}/accounts?center_id=${centerId}`
    );
  }

  /**
   *
   * @param {String} param0.cardId Zenoti card account uuid
   * @param {String} param0.invoiceId Booking invoice uuid
   * @param {String} param0.centerId Location/center uuid
   */
  async payByCard({ cardId, centerId, invoiceId }) {
    return await this.post(
      `/v1/invoices/${invoiceId}/online_payments`,
      {},
      {
        account_id: cardId,
        center_id: centerId,
      }
    );
  }
}

module.exports = Guests;
