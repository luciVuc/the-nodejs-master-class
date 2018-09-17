/**
 * Create and export configuration variables.
 */

// Container for all environments
const environments = {

  // Staging (default) environment
  staging: {
    'httpPort': 3000,
    'envName': 'staging'
  },

  // Production environment
  production: {
    'httpPort': 5000,
    'envName': 'production'
  }
};

// Determine which environment was passed as a command-line argument
const environment = typeof (process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not default to staging. Then export the module
module.exports = typeof (environments[environment]) === 'object' ? environments[environment] : environments.staging;
