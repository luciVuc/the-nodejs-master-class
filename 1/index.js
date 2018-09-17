/**
 * Define and instantiate the server
 */

// Dependencies
const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const router = require('./lib/router');

// Define the server
const server = {
  config: require('./config'),

  /**
   * Server request handler.
   */
  onRequest: function (req, res) {

    // Parse the url
    const parsedUrl = url.parse(req.url, true);

    // Get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object
    const queryStringObject = parsedUrl.query;

    // Get the HTTP method
    const method = req.method.toLowerCase();

    //Get the headers as an object
    const headers = req.headers;

    // Get the payload,if any
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', (data) => {
      buffer += decoder.write(data);
    });
    req.on('end', () => {
      buffer += decoder.end();

      // Check the router for a matching path for a handler. If one is not found, use the notFound handler instead.
      const chosenHandler = typeof (router.routes[trimmedPath]) !== 'undefined' ? router.routes[trimmedPath] : router.routeHandlers.notFound;

      // Construct the data object to send to the handler
      const data = {
        'trimmedPath': trimmedPath,
        'queryStringObject': queryStringObject,
        'method': method,
        'headers': headers,
        'payload': buffer
      };

      // Route the request to the handler specified in the router
      chosenHandler(data, function (statusCode, payload) {

        // Use the status code returned from the handler, or set the default status code to 200
        statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

        // Use the payload returned from the handler, or set the default payload to an empty object
        payload = typeof (payload) == 'object' ? payload : {};

        // Convert the payload to a string
        const payloadString = JSON.stringify(payload);

        // Return the response
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(statusCode);
        res.end(payloadString);
        console.log(trimmedPath, statusCode);
      });
    });
    return this;
  },

  /**
   * Initializes the server
   */
  init: function () {
    this.onRequest = this.onRequest.bind(this);

    // Instantiate and start the HTTP server
    this.http = http.createServer(this.onRequest);
    return this;
  },

  /**
   * Starts the server to listen oon the given ports
   */
  start: function () {
    if (!this.http) {
      this.init();
    }

    this.http.listen(this.config.httpPort, () => {
      console.log('The HTTP server is running on port ' + this.config.httpPort);
    });
    return this;
  }
};

// Start the server
server.start();
