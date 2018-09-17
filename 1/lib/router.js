/**
 * The request router.
 * Consists of predefined routes and route handlers.
 */

// Define all the handlers
const handlers = {

  // Hello handler
  hello: (data, callback) => {
    const sName = typeof data.queryStringObject.name === "string" && data.queryStringObject.name.length > 0 ? data.queryStringObject.name : "User";

    callback(200, {
      message: `Hello ${sName}. The current date and time is ${new Date().toLocaleString()}.`
    });
  },

  // Not-Found handler
  notFound: (data, callback) => {
    callback(404);
  }
};

// Define the routes
const routes = {
  'hello': handlers.hello
};

// Define and export the request router
module.exports = {
  routeHandlers: handlers,
  routes: routes
};