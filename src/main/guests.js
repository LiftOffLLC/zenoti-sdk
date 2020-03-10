const Rest = require('./helper/rest');

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
    return await this.post('/v1/guests', {}, params);
  }
}

module.exports = Guests;
