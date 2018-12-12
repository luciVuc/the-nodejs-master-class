// Dependencies
const User = require("./User");
const Token = require("./Token");
const Item = require("./Item");
const Order = require("./Order");

/**
 * Define and export all Request Handlers
 */
module.exports = {
  // Ping
  ping: (data, callback) => {
    if (typeof callback === "function") {
      setTimeout(function () {
        callback(200, "OK");
      }, 0);
    }
  },

  // Not-Found
  notFound: (data, callback) => {
    if (typeof callback === "function") {
      setTimeout(function () {
        callback(404, "Nope");
      }, 0);
    }
  },

  // Users - request handlers
  users: User.httpRequestHandler,

  // Tokens - request handlers
  tokens: Token.httpRequestHandler,

  // Items - request handlers
  items: Item.httpRequestHandler,

  // Orders - request handlers
  orders: Order.httpRequestHandler
};
