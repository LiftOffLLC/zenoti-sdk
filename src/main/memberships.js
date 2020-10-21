const Rest = require("./helper/rest");

class Memberships extends Rest {
  async create({
    centerId,
    userId,
    membershipId,
  }) {
    return await this.post(
      '/v1/invoices/memberships',
      {},
      {
        center_id: centerId,
        user_id: userId,
        membership_ids: membershipId,
      },
    );
  }
}

module.exports = Memberships;
