const _ = require("lodash");
const Centers = require("./centers");
const Bookings = require("./bookings");
const Guests = require("./guests");
const Services = require("./services");

class ZenotiClient {
  constructor(config) {
    this.config = _.clone(config || {});
    this.centers = new Centers(this.config);
    this.bookings = new Bookings(this.config);
    this.guests = new Guests(this.config);
    this.services = new Services(this.config);
  }
}

module.exports = ZenotiClient;
