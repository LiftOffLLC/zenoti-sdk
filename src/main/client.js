const _ = require("lodash");
const Centers = require("./centers");
const Bookings = require("./bookings");
const Guests = require("./guests");
const Services = require("./services");
const Employees = require("./employees");

class ZenotiClient {
  constructor(config) {
    this.config = _.clone(config || {});
    this.centers = new Centers(this.config);
    this.bookings = new Bookings(this.config);
    this.guests = new Guests(this.config);
    this.services = new Services(this.config);
    this.employees = new Employees(this.config);
  }
}

module.exports = ZenotiClient;
