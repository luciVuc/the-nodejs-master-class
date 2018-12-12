// Dependencies
const handlers = require("./handlers");

/**
 * Define and export the router (a hash-map of predefined request routes and route handlers).
 */
module.exports = {
  routeHandlers: handlers,

  // Define the routes
  routes: {
    'notFound': handlers.notFound,
    'ping': handlers.ping,
    'users': handlers.users,
    'user/login': handlers.users,
    'user/logout': handlers.users,
    'user/addToCart': handlers.users,
    'user/removeFromCart': handlers.users,
    'user/emptyCart': handlers.users,
    'user/checkout': handlers.users,
    'tokens': handlers.tokens,
    'items': handlers.items,
    'orders': handlers.orders
  }
};