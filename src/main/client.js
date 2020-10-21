const _ = require("lodash");
const Centers = require("./centers");
const Bookings = require("./bookings");
const Guests = require("./guests");
const Services = require("./services");
const Employees = require("./employees");
const Products = require("./products");
const Memberships = require("./memberships");
const Invoices = require("./invoices");

class ZenotiClient {
  constructor(config) {
    this.config = _.clone(config || {});
    this.centers = new Centers(this.config);
    this.bookings = new Bookings(this.config);
    this.guests = new Guests(this.config);
    this.services = new Services(this.config);
    this.employees = new Employees(this.config);
    this.products = new Products(this.config);
    this.memberships = new Memberships(this.config);
    this.invoices = new Invoices(this.config);
  }
}

module.exports = ZenotiClient;
