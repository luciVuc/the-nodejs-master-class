/**
 * Various, general purpose tasks
 */

// Dependencies
const config = require('./config');
const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

// Constants
const EMAIL_REGEXP = /^[A-Za-z0-9._]+\@[A-Za-z0-9._]+\.[A-Za-z]{2,3}$/i;
const IDs = {};

// Define the helpers module
const helpers = {};

/**
 * Parse a JSON string to an object in all cases, without throwing
 */
helpers.parseJsonToObject = function (str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return {};
  }
};

/**
 * Create a SHA256 hash
 */
helpers.hash = function (str) {
  if (typeof (str) == 'string' && str.length > 0) {
    return crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
  } else {
    return false;
  }
};

/**
 * Create a string of random alphanumeric characters, of a given length
 */
helpers.createRandomString = function (strLength) {
  strLength = typeof (strLength) == 'number' && strLength > 0 && strLength <= 21 ? strLength : 21;
  let sId;
  do {
    sId = Date.now().toString(36) + Math.random().toString(36).replace("0.", "");
  } while (IDs.hasOwnProperty(sId) || sId.length !== 21)
  IDs[sId] = true;
  return sId.substr(21 - strLength);
};

/**
 * Returns `true` if the given value has a valid user ID (email) format, or `false` otherwise.
 * @param {String} value
 * @returns {Boolean}
 */
helpers.isValidEmail = function (value) {
  return typeof value === "string" && EMAIL_REGEXP.test(value.trim());
};

/**
 * Returns `true` if the given value has a valid password format, or `false` otherwise.
 * @param {String} value
 * @returns {Boolean}
 */
helpers.isValidPassword = function (value) {
  return typeof value === "string" && value.trim().length >= 6;
};

/**
 * Returns `true` if the given value has a valid order ID, or `false` otherwise.
 * @static
 * @param {String} value
 * @returns {Boolean}
 */
helpers.isValidOrderId = function (value) {
  return typeof value === "string" && value.trim().length === 20;
};

/**
 * Returns `true` if the given value has a valid item ID, or `false` otherwise.
 * @static
 * @param {String} value
 * @returns {Boolean}
 */
helpers.isValidItemId = function (value) {
  return typeof value === "string" && value.trim().length === 10;
};

/**
 * Performs requests to external APIs.
 * @param {Object} options Request options
 * @param {String|Object} payload The payload
 * @param {Function} callback
 */
helpers.ajax = function (options, payload, callback) {
  options = typeof options === "object" ? options : {};
  callback = typeof callback === "function" ? callback : Function.prototype;

  // Instantiate the request object
  const req = https.request(options, (res) => {
    let result = "";
    res.setEncoding("utf-8");
    res.on("data", (chunk) => {
      result += chunk;
    });

    res.on("end", () => {
      // Grab the status code
      const statusCode = res.statusCode;
      // Callback successfully if the request went through
      if (statusCode === 200 || statusCode === 201) {
        callback(null, result);
      } else {
        callback({ Error: true });
      }
    });
  });

  // handle potential error events
  req.on("error", (err) => {
    callback(err);
  });

  // write the payload
  if (payload) {
    if (typeof payload === "string") {
      req.write(payload);
    } else if (typeof payload === "object") {
      req.write(querystring.stringify(payload));
    }
  }

  // send the request
  req.end();
};

helpers.sendTwilioSms = function (phone, msg, callback) {
  // Validate parameters
  phone = typeof (phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
  msg = typeof (msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;
  if (phone && msg) {

    // Configure the request payload
    var payload = {
      'From': config.twilio.fromPhone,
      'To': '+1' + phone,
      'Body': msg
    };
    var stringPayload = querystring.stringify(payload);


    // Configure the request details
    var requestDetails = {
      'protocol': 'https:',
      'hostname': 'api.twilio.com',
      'method': 'POST',
      'path': '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
      'auth': config.twilio.accountSid + ':' + config.twilio.authToken,
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload)
      }
    };

    // send the request
    helpers.ajax(requestDetails, payload, callback);
  } else {
    callback('Given parameters were missing or invalid');
  }
};

// Export the module
module.exports = helpers;
