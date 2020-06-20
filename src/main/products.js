const Rest = require("./helper/rest");

class Products extends Rest {
  async fetch({ centerId }) {
    return await this.get(
      `/v1/centers/${centerId}/products?expand=preferences`
    );
  }
}

module.exports = Products;
