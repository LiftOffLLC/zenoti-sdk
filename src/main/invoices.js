const Rest = require("./helper/rest");

class Invoices extends Rest {
  async getInvoice({ invoiceId }) {
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
      }
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

module.exports = Invoices;
