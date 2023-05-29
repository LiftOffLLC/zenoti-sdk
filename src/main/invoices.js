const Rest = require('./helper/rest');

class Invoices extends Rest {
  async fetch({ invoiceId }) {
    return await this.get(
      `/v1/invoices/${invoiceId}?expand=InvoiceItems&expand=Transactions`
    );
  }

  async addProducts({ invoiceId, products }) {
    return await this.put(
      `/v1/invoices/${invoiceId}/products`,
      {},
      {
        products,
      }
    );
  }

  async removeProduct({ invoiceId, itemId, comments }) {
    return await this.delete(
      `/v1/invoices/${invoiceId}/invoiceitems/${itemId}`,
      {},
      {
        comments,
      },
      true // forceAuthToken
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

  async insertCustomPayment({
    invoiceId,
    amount,
    tipAmount = 0,
    cashRegisterId,
    customPaymentId,
    notes = '',
  }) {
    return await this.post(
      `/v1/invoices/${invoiceId}/payment/custom`,
      {},
      {
        amount,
        tip_amount: tipAmount,
        cash_register_id: cashRegisterId,
        custom_payment_id: customPaymentId,
        additional_data: notes,
      },
      false // forceAuthToken
    );
  }

  async applyCampaignDiscount({ invoiceId, offerCode, centerId }) {
    return await this.post(
      `/v1/invoices/${invoiceId}/campaign_discount/apply`,
      {},
      {
        offer_code: offerCode,
        center_id: centerId,
      }
    );
  }

  async close({ invoiceId }) {
    return await this.post(`/v1/invoices/${invoiceId}/close`, {}, {}, false);
  }
}

module.exports = Invoices;
