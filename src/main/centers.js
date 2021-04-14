const Rest = require("./helper/rest");

class Centers extends Rest {
  async fetch(params = {}) {
    return await this.get("/v1/centers", params);
  }

  async therapists({ centerId }) {
    return await this.get(`/v1/centers/${centerId}/therapists`);
  }

  async memberships({ centerId }) {
    return await this.get(`/v1/centers/${centerId}/memberships`);
  }

  async employees({ centerId }, page = 1, size = 10) {
    return await this.get(
      `/v1/centers/${centerId}/employees?page=${page}&size=${size}`,
    );
  }
}

module.exports = Centers;
