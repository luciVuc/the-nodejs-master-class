// Dependencies
const helpers = require("../helpers");
const dataStore = require("../dataStore");

/**
 * Defines and implements the CRUD operations for authentication tokens, as well as the functionality
 * to easily serialize/de-serialize, validate and manipulate authentication `token` data.
 * @class Token
 */
module.exports = class Token {
  /**
   * HTTP Request handler for Tokens. It handles the HTTP `post`, `get`, `put` and `delete` methods.
   * @param {Object} data 
   * @param {String} data.path Recognized paths: `tokens`
   * @param {Object} data.queryParams
   * @param {Object} data.headers
   * @param {Object} data.payload
   * @param {String} data.method The HTTP method [`post` | `get` | `put` | `delete`]
   * @param {Function} callback 
   */
  static httpRequestHandler (data, callback) {
    data = data && typeof data === "object" ? data : {};
    callback = typeof callback === "function" ? callback : Function.prototype;

    const acceptedMethods = ["post", "get", "put", "delete"];
    const method = typeof data.method === "string" ? data.method.trim().toLowerCase() : "";
    if (acceptedMethods.indexOf(method) > -1) {
      Token[method](data, callback);
    } else {
      callback(405);
    }
    return Token;
  }

  /**
   * Creates and stores a new Token.
   * @param {Object} data 
   * @param {Object} data.payload
   * @param {String} data.payload.email User ID (email)
   * @param {String} data.payload.password User password
   * @param {Function} callback 
   */
  static post (data, callback) {
    data = data && typeof data === "object" ? data : {};
    callback = typeof callback === "function" ? callback : Function.prototype;

    // Check that all required fields are filled out
    const email = Token.isValidUserId(data.payload.email) ? data.payload.email.trim() : false;
    const password = Token.isValidPassword(data.payload.password) ? data.payload.password.trim() : false;

    if (email && password) {
      // Lookup the user who matches that email
      dataStore.read("users", email, function (err, userData) {
        if (!err && userData) {
          // Hash the sent password, and compare it to the password stored in the user object
          const hashedPassword = helpers.hash(password);
          if (hashedPassword === userData.password) {
            // If valid, create a new token with a random name. Set an expiration date 1 hour in the future.
            const tokenId = Token.createUniqueId();
            const expiration = Date.now() + 1000 * 60 * 60;
            const tokenObject = new Token({
              email: email,
              id: tokenId,
              expiration: expiration
            }).toJSON();

            // Store the token
            dataStore.create("tokens", tokenId, tokenObject, (err) => {
              if (!err) {
                callback(200, tokenObject);
              } else {
                callback(500, { error: "Could not create the new token" });
              }
            });
          } else {
            callback(400, { error: "Password did not match the specified user password" });
          }
        } else {
          callback(404, { error: "A token with the given ID cannot be found" });
        }
      });
    } else {
      callback(400, { error: "Missing required field(s)." });
    }
    return Token;
  }

  /**
   * Retrieves and calls back with an existing Token.
   * @param {Object} data 
   * @param {Object} data.queryParams
   * @param {String} data.queryParams.id 
   * @param {Function} callback 
   */
  static get (data, callback) {
    data = data && typeof data === "object" ? data : {};
    callback = typeof callback === "function" ? callback : Function.prototype;

    // Check that id is valid
    const id = Token.isValidTokenId(data.queryParams.id) ? data.queryParams.id.trim() : false;
    if (id) {
      // Lookup the token
      dataStore.read("tokens", id, function (err, tokenData) {
        if (!err && tokenData) {
          callback(200, new Token(tokenData).toJSON());
        } else {
          callback(404, { error: "A token with the given ID cannot be found" });
        }
      });
    } else {
      callback(400, { error: "Missing required field, or field invalid" })
    }
    return Token;
  }

  /**
   * Updates or modifies an existing Token.
   * @param {Object} data 
   * @param {Object} data.payload
   * @param {String} data.payload.id 
   * @param {Boolean} data.payload.extend 
   * @param {Function} callback 
   */
  static put (data, callback) {
    data = data && typeof data === "object" ? data : {};
    callback = typeof callback === "function" ? callback : Function.prototype;

    const id = Token.isValidTokenId(data.payload.id) ? data.payload.id.trim() : false;
    const extend = typeof (data.payload.extend) == "boolean" && data.payload.extend == true ? true : false;
    if (id && extend) {
      // Lookup the existing token
      dataStore.read("tokens", id, (err, tokenData) => {
        if (!err && tokenData) {
          const token = new Token(tokenData);

          // Check to make sure the token isn't already expired
          if (token.id === id && token.expiration > Date.now()) {
            // Set the expiration an hour from now
            token.expiration = Date.now() + 1000 * 60 * 60;
            // Store the new updates
            dataStore.update("tokens", id, token.toJSON(), (err) => {
              if (!err) {
                callback(200);
              } else {
                callback(500, { error: "Could not update this token's expiration." });
              }
            });
          } else if (token.id === id) {
            // delete the token, if it is expired
            dataStore.delete("tokens", id, (err) => {
              if (!err) {
                callback(400, { error: "The token cannot be extended (it is expired and deleted)." });
              } else {
                callback(500, { error: "The token cannot be extended (it is expired, but could not be deleted)." });
              }
            });
          }
        } else {
          callback(404, { error: "A token with the given ID cannot be found" });
        }
      });
    } else {
      callback(400, { error: "Missing required field(s) or field(s) are invalid." });
    }
    return Token;
  }

  /**
   * Deletes an existing Token.
   * @param {Object} data 
   * @param {Object} data.queryParams
   * @param {String} data.queryParams.id 
   * @param {Function} callback 
   */
  static delete (data, callback) {
    data = data && typeof data === "object" ? data : {};
    callback = typeof callback === "function" ? callback : Function.prototype;

    // Check that id is valid
    let id = Token.isValidTokenId(data.queryParams.id) ? data.queryParams.id.trim() : false;
    let token; // = new Token(tokenData);
    if (id) {
      // Lookup the token
      dataStore.read("tokens", id, function (err, tokenData) {
        token = new Token(tokenData);
        if (!err && token.id === id) {
          // Delete the token
          dataStore.delete("tokens", id, function (err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, { error: "Could not delete the specified token" });
            }
          });
        } else {
          callback(400, { error: "Could not find the specified token." });
        }
      });
    } else {
      callback(400, { error: "Missing required field" });
    }
    return Token;
  }

  /**
   * Returns `true` if the given value has a valid token ID format, or `false` otherwise.
   * @static
   * @param {String} value
   * @returns {Boolean}
   * @memberof Token
   */
  static isValidTokenId (value) {
    return typeof value === "string" && value.trim().length === 20;
  }

  /**
   * Returns `true` if the given value has a valid user ID (email) format, or `false` otherwise.
   * @static
   * @param {String} value
   * @returns {Boolean}
   * @memberof Token
   */
  static isValidUserId (value) {
    return helpers.isValidEmail(value);
  }

  /**
   * Returns `true` if the given value has a valid password format, or `false` otherwise.
   * @static
   * @param {String} value
   * @returns {Boolean}
   * @memberof Token
   */
  static isValidPassword (value) {
    return helpers.isValidPassword(value);
  }

  /**
   * Creates and returns a 20 characters long string, as unique id.
   * @static
   * @returns {String}
   * @memberof Token
   */
  static createUniqueId () {
    return helpers.createRandomString(20);
  }

  /**
   * Creates an instance of Token.
   * @constructor
   * @param {Object} params
   * @param {String} params.email The ID (email) of the user it is associated with
   * @param {String} params.id Its own 20 chars long ID
   * @param {Number} [params.expiration] The time (in milliseconds) when this toked becomes invalid
   * @memberof Token.prototype
   */
  constructor(params) {
    params = params instanceof Object ? params : {};
    this.email = params.email;
    this.id = params.id;
    this.expiration = params.expiration;
  }

  /**
   * The ID (email) of the user associated with this token.
   * @property
   * @type {String}
   * @memberof Token.prototype
   */
  set email (value) {
    if (Token.isValidUserId(value)) {
      this._email = value.trim();
    }
    return this;
  }
  get email () {
    return this._email || null;
  }

  /**
   * The ID of this token.
   * @property
   * @type {String}
   * @memberof Token.prototype
   */
  set id (value) {
    if (Token.isValidTokenId(value)) {
      this._id = value.trim();
    }
    return this;
  }
  get id () {
    return this._id || null;
  }

  /**
   * The expiration date and time of this token in milliseconds.
   * @property
   * @type {Number}
   * @memberof Token.prototype
   */
  set expiration (value) {
    this._expiration = typeof value === "number" ? value : null;
    return this;
  }
  get expiration () {
    return this._expiration || null;
  }

  /**
   * Delete this token (if possible).
   * @public
   * @param {Function} [callback]
   * @returns {Token} 
   * @memberof Token.prototype
   */
  delete (callback) {
    Token.delete({ queryParams: { id: this.id } }, callback);
    return this;
  }

  /**
   * Extends, if possible, the expiration time of this token.
   * @public
   * @param {Function} [callback]
   * @returns {Token} 
   * @memberof Token.prototype
   */
  extend (callback) {
    Token.put({ payload: { id: this.id, extend: true } }, callback);
    return this;
  }

  /**
   * Verifies and calls back with `true` if this Token is still valid, or with `false` otherwise.
   * @public
   * @param {Function} callback
   * @memberof Token.prototype
   */
  isValid (callback) {
    callback = typeof callback === "function" ? callback : Function.prototype;
    // Lookup the token
    dataStore.read("tokens", this.id, (err, data) => {
      if (!err && data) {
        data = data || {};
        this._expiration = data.expiration;
        // Check that the token is for the given user and has not expired
        if (data.id === this.id && this.expiration > Date.now()) {
          callback(true);
        } else {
          callback(false);
          // also delete this token from the data storage if it is expired
          this.delete();
        }
      } else {
        callback(false);
      }
    });
    return this;
  }

  /**
   * Returns a JSON object containing this token's internal state.
   * @public
   * @returns {Object}
   * @memberof Token.prototype
   */
  toJSON () {
    return {
      email: this.email,
      id: this.id,
      expiration: this.expiration
    };
  }
}