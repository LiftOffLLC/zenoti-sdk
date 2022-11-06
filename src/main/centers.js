const Rest = require("./helper/rest");

class Centers extends Rest {
  async fetch(params = {}) {
    return await this.get("/v1/centers", params);
  }

  async therapists({ centerId, date }) {
    return await this.get(`/v1/centers/${centerId}/therapists?date=${date}`);
  }

  async categories({ centerId }) {
    return await this.get(
      `/v1/centers/${centerId}/categories?include_sub_categories=true&type=2&size=1000`
    );
  }
}

module.exports = Centers;
