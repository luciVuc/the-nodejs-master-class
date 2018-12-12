// Dependencies
const server = require('./server');

/**
 * Declare and export the main module of the app
 */
module.exports = {
  /**
   * Initializes the app
   */
  init: () => {

    // Start the server
    server.init();

    // Start the workers
    // workers.init();
  }
};