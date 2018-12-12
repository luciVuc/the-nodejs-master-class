/**
 * Create and export configuration variables for all environments.
 */
const environments = Object.freeze({

  // Staging (default) environment
  staging: Object.freeze({
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging',
    'hashingSecret': 'thisIsASecret',
    'maxChecks': 5,
    'stripe': {
      publicKey: "pk_test_gsNHkNdtiWJ822u2lNCi4Blf",
      secretKey: "sk_test_MMTWqfUXOrKzgvs9fmHQrWJO"
    },
    'mailgun': {
      apiKey: "9a181dbebc109b5ec5f487bd3888ead0-4836d8f5-1d3da058",
      domain: "sandbox1c69e583c92048b2bbed68081d919a4f.mailgun.org"
    },
    'twilio': {
      'accountId': 'ACb32d411ad7fe886aac54c665d25e5c5d',
      'authToken': '9455e3eb3109edc12e3d8c92768f7a67',
      'fromPhone': '+15005550006'
    }
  }),

  // Production environment
  production: Object.freeze({
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production',
    'hashingSecret': 'thisIsAlsoASecret',
    'maxChecks': 10,
    'stripe': {
      publicKey: '',
      secretKey: ''
    },
    'mailgun': {
      apiKey: '',
      domain: ''
    },
    'twilio': {
      'accountSid': '',
      'authToken': '',
      'fromPhone': ''
    }
  })
});

// Determine which environment was passed as a command-line argument
const environment = typeof (process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not default to staging. Then export the module
module.exports = typeof (environments[environment]) === 'object' ? environments[environment] : environments.staging;
