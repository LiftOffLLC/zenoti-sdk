const Rest = require("./helper/rest");
const _ = require("lodash");
class GiftCards extends Rest {
  async confirmGiftCard({
    centerId,
    guestId,
    templateId,
    recipientName,
    recipientEmail,
    message = '',
  }) {
    const data = {
      center_id: centerId,
      guest_id: guestId,
      giftcards: [
        {
          template_id: templateId,
          occassion: {
            message
          },
          recepient: {
            name: recipientName,
            email: recipientEmail
          }
        }
      ]
    }
    const result = await this.post('/v1/invoices/giftcards', {}, data);
    return result.invoice_id
  }
}
module.exports = GiftCards;