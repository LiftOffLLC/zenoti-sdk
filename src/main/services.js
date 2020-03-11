const Rest = require("./helper/rest");

class Services extends Rest {
  /**
   * Get services
   * Retrive services of specigic center
   *
   * @param {String} centerID
   */
  async fetch({ centerID }) {
    return await this.get(`/v1/centers/${centerID}/services`);
  }
}

module.exports = Services;
