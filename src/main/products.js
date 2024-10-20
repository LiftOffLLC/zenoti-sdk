const Rest = require("./helper/rest");

class Products extends Rest {
  async createInvoice({ centerId, guestId, notes, products }) {
    return await this.post(
      `/v1/invoices/products`,
      {},
      {
        center_id: centerId,
        guest_id: guestId,
        notes,
        products,
      },
      true // forceAuthToken
    );
  }

  async fetch({ centerId }) {
    return await this.get(
      `/v1/centers/${centerId}/products?expand=preferences&expand=tags&expand=catalog_info&expand=barcodes&show_in_catalog=true&expand=centers`
    );
  }
}

module.exports = Products;
