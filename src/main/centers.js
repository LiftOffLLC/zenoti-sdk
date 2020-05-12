const Rest = require("./helper/rest");

class Centers extends Rest {
  async fetch(params = {}) {
    return await this.get("/v1/centers", params);
  }

  async therapists({ centerId }) {
    return await this.get(`/v1/centers/${centerId}/therapists`);
  }
}

module.exports = Centers;
