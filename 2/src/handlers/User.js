// Dependencies
const dataStore = require("../dataStore");
const helpers = require("../helpers");
const Token = require("./Token");
const Item = require("./Item");
const Order = require("./Order");

const acceptedMethods = ["post", "get", "put", "delete"];
const putOnlyPaths = ["user/logout", "user/addToCart", "user/removeFromCart", "user/emptyCart", "user/checkout"];
const postOnlyPaths = ["user/login"];

/**
 * Defines and implements the CRUD operations for users, as well as the functionality
 * to easily serialize/de-serialize, validate and manipulate `user` data.
 * @class User
 */
module.exports = class User {
  /**
   * HTTP Request handler for the Users. It handles the HTTP `post`, `get`, `put` and `delete` methods.
   * @param {Object} data 
   * @param {String} data.path Recognized paths: `users`, `user/login`, `user/logout`, `user/addToCart`, `user/removeFromCart`, `user/emptyCart`
   * @param {Object} data.queryParams
   * @param {Object} data.headers
   * @param {Object} data.payload
   * @param {String} data.method The HTTP method [`post` | `get` | `put` | `delete`]
   * @param {Function} callback 
   */
  static httpRequestHandler (data, callback) {
    data = data && typeof data === "object" ? data : {};
    data.headers = typeof data.headers === "object" ? data.headers : {};
    data.payload = typeof data.payload === "object" ? data.payload : {};
    callback = typeof callback === "function" ? callback : Function.prototype;

    const method = typeof data.method === "string" ? data.method.trim().toLowerCase() : "";
    const path = typeof data.path === "string" ? data.path.trim() : null;

    if ((method === "post" && postOnlyPaths.indexOf(path) > -1) || (method === "put" && putOnlyPaths.indexOf(path) > -1)) {
      User[path.trim().replace("user/", "").trim()](data, callback);
    } else if (acceptedMethods.indexOf(method) > -1) {
      User[method](data, callback);
    } else {
      callback(405);
    }
    return User;
  }

  /**
   * Creates and stores a new User.
   * @param {Object} data 
   * @param {Object} data.payload
   * @param {String} data.payload.email 
   * @param {String} data.payload.password 
   * @param {String} data.payload.tosAgreement 
   * @param {String} data.payload.firstName 
   * @param {String} data.payload.lastName 
   * @param {String} [data.payload.streetAddress] 
   * @param {Object} [data.payload.cart] 
   * @param {Function} callback 
   */
  static post (data, callback) {
    data = data && typeof data === "object" ? data : {};
    data.headers = typeof data.headers === "object" ? data.headers : {};
    data.payload = typeof data.payload === "object" ? data.payload : {};
    callback = typeof callback === "function" ? callback : Function.prototype;

    // Check that all required fields are filled out
    const email = User.isValidEmail(data.payload.email) ? data.payload.email.trim() : false;
    const password = User.isValidPassword(data.payload.password) ? data.payload.password.trim() : false;
    const tosAgreement = typeof data.payload.tosAgreement === "boolean" ? data.payload.tosAgreement : false;
    const firstName = typeof data.payload.firstName === "string" && data.payload.firstName.trim().length ? data.payload.firstName.trim() : false;
    const lastName = typeof data.payload.lastName === "string" && data.payload.lastName.trim().length ? data.payload.lastName.trim() : false;
    const streetAddress = typeof data.payload.streetAddress === "string" ? data.payload.streetAddress.trim() : "";
    const cart = data.payload.cart instanceof Array ? data.payload.cart : {};

    if (firstName && lastName && email && password && tosAgreement) {
      // Make sure the user doesn't already exist
      dataStore.read("users", email, (err, data) => {
        if (err) {
          // Hash the password
          const hashedPassword = helpers.hash(password);

          if (hashedPassword) {
            // Create the user object
            const userData = new User({
              email: email,
              password: hashedPassword,
              // tosAgreement: tosAgreement,
              firstName: firstName,
              lastName: lastName,
              streetAddress: streetAddress,
              cart: cart
            }).toJSON();

            // Store the user
            dataStore.create("users", email, userData, (err) => {
              if (!err) {
                callback(200, userData);
              } else {
                callback(500, { "Error": "Could not create the new user" });
              }
            });
          } else {
            callback(500, { "Error": "Could not hash this user password." });
          }
        } else {
          callback(400, { "Error": "A user with this email already exists" });
        }
      });
    } else {
      callback(400, { "Error": "Missing required fields" });
    }
    return User;
  }

  /**
   * Retrieves and calls back with an existing user.
   * @param {Object} data 
   * @param {Object} data.headers
   * @param {String} data.headers.tokenid
   * @param {Object} data.queryParams
   * @param {String} data.queryParams.email 
   * @param {Function} callback 
   */
  static get (data, callback) {
    data = data && typeof data === "object" ? data : {};
    data.headers = typeof data.headers === "object" ? data.headers : {};
    data.payload = typeof data.payload === "object" ? data.payload : {};
    callback = typeof callback === "function" ? callback : Function.prototype;

    // Check that email is valid
    const email = User.isValidEmail(data.queryParams.email) ? data.queryParams.email.trim() : false;
    if (email) {
      // Get tokenId from headers
      const tokenId = Token.isValidTokenId(data.headers.tokenid) ? data.headers.tokenid.trim() : false;

      if (tokenId) {
        const token = new Token({ id: tokenId, email: email });

        // Verify that the given tokenId is valid for the email number
        token.isValid((tokenIsValid) => {
          if (tokenIsValid) {
            // Lookup the user
            dataStore.read("users", email, (err, data) => {
              if (!err && data) {
                let userData = new User(data).toJSON();
                // Remove the hashed password from the user user object before returning it to the requester
                delete userData.password;
                callback(200, userData);
              } else {
                callback(404);
              }
            });

            // additionally, extend the token expiration time, since the user is active
            token.extend();
          } else {
            callback(403, { "Error": "Missing required token in header, or token is invalid." })
          }
        });
      } else {
        callback(403, { "Error": "Missing required token in header, or token is invalid." });
      }
    } else {
      callback(400, { "Error": "Missing required field" })
    }
    return User;
  }

  /**
   * Updates or modifies an existing user.
   * @param {Object} data 
   * @param {Object} data.headers
   * @param {String} data.headers.tokenid
   * @param {Object} data.payload
   * @param {String} data.payload.email 
   * @param {String} [data.payload.password] 
   * @param {String} [data.payload.firstName] 
   * @param {String} [data.payload.lastName] 
   * @param {String} [data.payload.streetAddress] 
   * @param {Object} [data.payload.cart] 
   * @param {Array} [data.payload.orders] 
   * @param {Function} callback 
   */
  static put (data, callback) {
    data = data && typeof data === "object" ? data : {};
    data.headers = typeof data.headers === "object" ? data.headers : {};
    data.payload = typeof data.payload === "object" ? data.payload : {};
    callback = typeof callback === "function" ? callback : Function.prototype;

    // Check for required field
    const email = User.isValidEmail(data.payload.email) ? data.payload.email.trim() : false;

    // Check for optional fields
    const password = User.isValidPassword(data.payload.password) ? data.payload.password.trim() : false;
    const firstName = typeof (data.payload.firstName) === "string" && data.payload.firstName.trim().length ? data.payload.firstName.trim() : false;
    const lastName = typeof (data.payload.lastName) === "string" && data.payload.lastName.trim().length ? data.payload.lastName.trim() : false;
    const streetAddress = typeof (data.payload.streetAddress) === "string" && data.payload.streetAddress.trim().length ? data.payload.streetAddress.trim() : false;
    const cart = typeof data.payload.cart === "object" ? data.payload.cart : false;
    const orders = data.payload.orders instanceof Array ? data.payload.orders : false;

    // Error if email is invalid
    if (email) {
      // Error if nothing is sent to update
      if (firstName || lastName || password || streetAddress || cart || orders) {

        // Get tokenId from headers
        const tokenId = Token.isValidTokenId(data.headers.tokenid) ? data.headers.tokenid : false;

        if (tokenId) {
          const token = new Token({ id: tokenId, email: email });

          // Verify that the given tokenId is valid for the email
          token.isValid((tokenIsValid) => {
            if (tokenIsValid) {
              // Lookup the user
              dataStore.read("users", email, (err, userData) => {
                if (!err && userData) {
                  // Update the fields if necessary
                  if (firstName) {
                    userData.firstName = firstName;
                  }
                  if (lastName) {
                    userData.lastName = lastName;
                  }
                  if (password) {
                    userData.password = helpers.hash(password);
                  }
                  if (streetAddress) {
                    userData.streetAddress = streetAddress;
                  }
                  if (cart) {
                    userData.cart = cart;
                  }
                  if (orders) {
                    userData.orders = orders;
                  }

                  // Store the new updates
                  const user = new User(userData);
                  if (user.email === email) {
                    const userData = user.toJSON();
                    dataStore.update("users", email, userData, (err) => {
                      if (!err) {
                        callback(200, userData);
                      } else {
                        callback(500, { "Error": "Could not update the specified user." });
                      }
                    });
                  } else {
                    callback(400, { "Error": "Could not update the specified user" });
                  }

                  // additionally, extend the token expiration time, since the user is active
                  token.extend();
                } else {
                  callback(400, { "Error": "Specified user does not exist." });
                }
              });
            } else {
              callback(403, { "Error": "Missing required token in header, or token is invalid." })
            }
          });
        } else {
          callback(403, { "Error": "Missing required token in header, or token is invalid." });
        }
      } else {
        callback(400, { "Error": "Missing fields to update." });
      }
    } else {
      callback(400, { "Error": "Missing required field." });
    }
    return this;
  }

  /**
   * Deletes an existing User.
   * @param {Object} data 
   * @param {Object} data.headers
   * @param {String} data.headers.tokenid
   * @param {Object} data.queryParams
   * @param {String} data.queryParams.email 
   * @param {Function} callback 
   */
  static delete (data, callback) {
    data = data && typeof data === "object" ? data : {};
    data.headers = typeof data.headers === "object" ? data.headers : {};
    data.payload = typeof data.payload === "object" ? data.payload : {};
    callback = typeof callback === "function" ? callback : Function.prototype;

    // 1. Check that email number is valid
    const email = User.isValidEmail(data.queryParams.email) ? data.queryParams.email.trim() : false;
    if (email) {

      // 2. Get tokenId from headers
      const tokenId = Token.isValidTokenId(data.headers.tokenid) ? data.headers.tokenid : false;

      if (tokenId) {
        const token = new Token({ id: tokenId, email: email });

        // 3. Verify that the given tokenId is valid for the email number
        token.isValid((tokenIsValid) => {
          if (tokenIsValid) {
            // 4. Lookup the user
            dataStore.read("users", email, (err, userData) => {
              if (!err && userData) {
                const user = new User(userData);

                if (user.email === email) {
                  // 5. Log out the user
                  token.delete((statusCode, err) => {
                    if (statusCode === 200) {
                      // 6. Delete the user data
                      dataStore.delete("users", email, (err) => {
                        if (!err) {
                          // 7. Delete each of the orders associated with the user
                          const userOrders = user.orders instanceof Array ? user.orders : [];
                          const ordersToDelete = userOrders.length;
                          if (ordersToDelete > 0) {
                            let ordersDeleted = 0;
                            let deletionErrors = false;
                            // Loop through the orders
                            userOrders.forEach(function (orderId) {
                              // Delete the order
                              dataStore.delete("orders", orderId, function (err) {
                                if (err) {
                                  deletionErrors = true;
                                }
                                ordersDeleted++;
                                if (ordersDeleted === ordersToDelete) {
                                  if (!deletionErrors) {
                                    callback(200, true);
                                  } else {
                                    callback(500, { "Error": "Errors encountered while deleting all of the user's orders. All orders may not have been deleted from the system successfully." })
                                  }
                                }
                              });
                            });
                          } else {
                            callback(200, "OK");
                          }
                        } else {
                          callback(400, { "Error": "Could not delete the specified user" });
                        }
                      });
                    } else {
                      callback(statusCode, err);
                    }
                  });
                } else {
                  callback(400, { "Error": "Could not find the specified user." });
                }
              } else {
                callback(400, { "Error": "Could not find the specified user." });
              }
            });
          } else {
            callback(403, { "Error": "Missing required tokenId in header, or tokenId is invalid." });
          }
        });
      } else {
        callback(403, { "Error": "Missing required token in header, or token is invalid." });
      }
    } else {
      callback(400, { "Error": "Missing required field" })
    }
    return User;
  }

  /**
   * Returns a token based on the given user email and password.
   * @static
   * @param {Object} data 
   * @param {Object} data.payload
   * @param {String} data.payload.email 
   * @param {String} data.payload.password 
   * @param {Function} callback 
   * @memberof User
   */
  static login (data, callback) {
    Token.post(data, callback);
    return User;
  }

  /**
   * Removes the authentication token of the given user
   * @static
   * @param {Object} data 
   * @param {Object} data.payload
   * @param {String} data.payload.tokenId 
   * @param {Function} callback 
   * @memberof User
   */
  static logout (data, callback) {
    data = typeof data === "object" ? data : {};
    data.payload = typeof data.payload === "object" ? data.payload : {};
    Token.delete({ queryParams: { id: data.payload.tokenId } }, callback);
    return User;
  }

  /**
  * Adds an item to an user's cart.
  * @param {Object} data 
  * @param {Object} data.headers
  * @param {String} data.headers.tokenid
  * @param {Object} data.payload
  * @param {String} data.payload.email 
  * @param {String} data.payload.itemId 
  * @param {Number} data.payload.quantity 
  * @param {Function} callback 
  */
  static addToCart (data, callback) {
    data = data && typeof data === "object" ? data : {};
    data.headers = typeof data.headers === "object" ? data.headers : {};
    data.payload = typeof data.payload === "object" ? data.payload : {};
    callback = typeof callback === "function" ? callback : Function.prototype;

    // extract the list of items
    dataStore.list("items", (err, itemsData) => {
      const itemId = Item.isValidId(data.payload.itemId) ? data.payload.itemId : "";
      const quantity = Item.isValidPrice(data.payload.quantity) ? data.payload.quantity : 0.0;

      // if the given itemId is valid (is in the list of items) 
      if (!err && itemsData instanceof Array && itemsData.indexOf(itemId) > -1) {
        // get the user data
        data.queryParams = typeof data.queryParams === "object" ? data.queryParams : {};
        data.queryParams.email = data.payload.email;
        User.get(data, (statusCode, userData) => {
          if (statusCode === 200 && userData) {
            const user = new User(userData);

            if (user.email === data.payload.email) {
              // update user's cart with the given itemId and quantity
              if (quantity > 0) {
                user.cart[itemId] = quantity;
              } else {
                delete user.cart[itemId];
              }

              User.put({
                payload: {
                  email: user.email,
                  cart: user.cart
                },
                headers: data.headers
              }, callback);
            } else {
              callback(400, { "Error": "Could not update the specified user" });
            }
          } else {
            callback(statusCode, userData);
          }
        });
      } else {
        callback(500, { "Error": "Unable to load the list of items" });
      }
    });
    return User;
  }

  /**
  * Removes an item from an user's cart.
  * @param {Object} data 
  * @param {Object} data.headers
  * @param {String} data.headers.tokenid
  * @param {Object} data.payload
  * @param {String} data.payload.email 
  * @param {String} data.payload.itemId 
  * @param {Function} callback 
  */
  static removeFromCart (data, callback) {
    data = data && typeof data === "object" ? data : {};
    data.headers = typeof data.headers === "object" ? data.headers : {};
    data.payload = typeof data.payload === "object" ? data.payload : {};
    data.payload.quantity = 0;
    return User.addToCart(data, callback);
  }

  /**
   * Removes all items from an user's cart.
   * @param {Object} data 
   * @param {Object} data.headers
   * @param {String} data.headers.tokenid
   * @param {Object} data.payload
   * @param {String} data.payload.email 
   * @param {Function} callback 
   */
  static emptyCart (data, callback) {
    data = data && typeof data === "object" ? data : {};
    data.headers = typeof data.headers === "object" ? data.headers : {};
    data.payload = typeof data.payload === "object" ? data.payload : {};
    data.queryParams = typeof data.queryParams === "object" ? data.queryParams : {};
    data.queryParams.email = data.payload.email;

    // extract the user data
    User.get(data, (statusCode, userData) => {
      if (statusCode === 200 && userData) {
        const user = new User(userData);

        if (user.email === data.payload.email) {
          // update user's cart
          user.cart = {};

          User.put({
            payload: {
              email: user.email,
              cart: user.cart
            },
            headers: data.headers
          }, callback);
        } else {
          callback(400, { "Error": "Could not update the specified user" });
        }
      } else {
        callback(statusCode, userData);
      }
    });

    return User;
  }

  /**
   * Proceeds to checkout, placing an order with all items in the User's cart.
   * @param {Object} data 
   * @param {Object} data.headers
   * @param {String} data.headers.tokenid
   * @param {Object} data.payload
   * @param {String} data.payload.email 
   * @param {String} [data.payload.stripeToken=tok_visa] One of these: `tok_visa`, `tok_visa_debit`, `tok_mastercard`, `tok_mastercard_debit`, `tok_mastercard_prepaid`, `tok_amex`, `tok_discover`, `tok_diners`, `tok_jcb`, `tok_unionpay`
   * @param {Function} callback 
   */
  static checkout (data, callback) {
    data = data && typeof data === "object" ? data : {};
    data.headers = typeof data.headers === "object" ? data.headers : {};
    data.payload = typeof data.payload === "object" ? data.payload : {};
    callback = typeof callback === "function" ? callback : Function.prototype;

    // 1. Check that email is valid
    const email = User.isValidEmail(data.payload.email) ? data.payload.email.trim() : false;

    if (email) {
      // 2. Get tokenId from headers
      const tokenId = Token.isValidTokenId(data.headers.tokenid) ? data.headers.tokenid.trim() : false;

      if (tokenId) {
        const token = new Token({ id: tokenId, email: email });

        // 3. Verify that the given tokenId is valid for the email
        token.isValid((tokenIsValid) => {
          if (tokenIsValid) {
            // 4. get the user
            data.queryParams.email = email;
            User.get(data, (statusCode, userData) => {
              if (statusCode === 200 && userData) {
                // 5. create a user object based on the user data
                let user = new User(userData);
                
                if (Object.keys(user.cart).length > 0) {
                  // 6. create a new order based on the user's cart items
                  Order.post({ payload: { email: user.email, items: user.cart }}, (statusCode, orderData) => {
                    if (statusCode === 200 && orderData) {
                      const order = new Order(orderData);

                      // 7. Complete (pay) the order 
                      order.complete({ stripeToken: data.payload.stripeToken || "tok_visa" }, (statusCode, payment) => {
                        if (statusCode === 200) {
                          // 8. Update the user's orders list
                          user.orders.push(order.id);
                          user.cart = {};

                          User.put({
                            payload: {
                              email: user.email,
                              cart: user.cart,
                              orders: user.orders
                            },
                            headers: data.headers
                          }, (statusCode, userData) => {
                            if (statusCode === 200) {
                              callback(statusCode, payment);
                            } else {
                              callback(statusCode, userData);
                            }
                          });
                        } else {
                          callback(statusCode, payment);
                        }
                      });          
                    } else {
                      callback(statusCode, orderData);
                    }
                  });
                } else {
                  callback(403, { "Error": "Cannot create order. Cart is empty." });
                }
              } else {
                callback(statusCode, userData);
              }
            });

            // additionally, extend the token expiration time, since the user is active
            token.extend();
          } else {
            callback(403, { "Error": "Missing required token in header, or token is invalid." })
          }
        });
      } else {
        callback(403, { "Error": "Missing required token in header, or token is invalid." });
      }
    } else {
      callback(400, { "Error": "Missing required field" })
    }
    return User;
  }

  /**
   * Returns `true` if the given value has a valid email format, or `false` otherwise.
   * @static
   * @param {String} value
   * @returns {Boolean}
   * @memberof User
   */
  static isValidEmail (value) {
    return helpers.isValidEmail(value);
  }

  /**
   * Returns `true` if the given value has a valid password format, or `false` otherwise.
   * @static
   * @param {String} value
   * @returns {Boolean}
   * @memberof User
   */
  static isValidPassword (value) {
    return helpers.isValidPassword(value);
  }

  /**
   * Creates an instance of User.
   * @constructor
   * @param {Object} params
   * @param {String} params.email User ID
   * @param {String} params.password
   * @param {String} params.tosAgreement
   * @param {String} [params.firstName]
   * @param {String} [params.lastName]
   * @param {String} [params.streetAddress]
   * @param {Object} [params.cart] A hash-map key-value pairs, where the `key` is the `itemId` and the `value` is the quantity.
   * @memberof User.prototype
   */
  constructor(params) {
    params = params instanceof Object ? params : {};
    this.email = params.email;
    this.password = params.password;
    // this.tosAgreement = params.tosAgreement;
    this.firstName = params.firstName;
    this.lastName = params.lastName;
    this.streetAddress = params.streetAddress;
    this.cart = params.cart instanceof Object ? params.cart : {};
    this.orders = params.orders instanceof Array ? params.orders : [];
  }

  /**
   * The email (the user ID)
   * @property
   * @type {String}
   * @memberof User.prototype
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
   * User's password
   * @property
   * @type {String}
   * @memberof User.prototype
   */
  set password (value) {
    if (User.isValidPassword(value)) {
      this._password = value.trim();
    }
    return this;
  }
  get password () {
    return this._password || null;
  }

  /**
   * User's first name
   * @property
   * @type {String}
   * @memberof User.prototype
   */
  set firstName (value) {
    this._firstName = typeof value === "string" ? value.trim() : "";
    return this;
  }
  get firstName () {
    return this._firstName;
  }

  /**
   * User's last name
   * @property
   * @type {String}
   * @memberof User.prototype
   */
  set lastName (value) {
    this._lastName = typeof value === "string" ? value.trim() : "";
    return this;
  }
  get lastName () {
    return this._lastName;
  }

  /**
   * User's full name
   * @readonly
   * @property
   * @type {String}
   * @memberof User.prototype
   */
  get name () {
    return `${this._firstName} ${this._lastName}`.trim();
  }

  /**
   * User's street address
   * @property
   * @type {String}
   * @memberof User.prototype
   */
  set streetAddress (value) {
    this._streetAddress = typeof value === "string" ? value.trim() : "";
    return this;
  }
  get streetAddress () {
    return this._streetAddress;
  }

  /**
   * This user's cart items
   * @property
   * @type {Object} A hash-map key-value pairs, where the `keys` are `itemIds` and their `values` are the quantities
   * @memberof User.prototype
   */
  set cart (value) {
    if (value instanceof Object) {
      this._cart = value;
    }
    return this;
  }
  get cart () {
    return this._cart;
  }

  /**
   * The list of IDs of this user's orders
   * @property
   * @type {Array} A array of order IDs
   * @memberof User.prototype
   */
  set orders (value) {
    if (value instanceof Array) {
      this._orders = value;
    }
    return this;
  }
  get orders () {
    return this._orders;
  }

  /**
   * Returns a JSON object containing user's internal state.
   * @public
   * @returns {Object}
   * @memberof User.prototype
   */
  toJSON () {
    return {
      email: this.email,
      password: this.password,
      // tosAgreement: this.tosAgreement,
      firstName: this.firstName,
      lastName: this.lastName,
      streetAddress: this.streetAddress,
      cart: Object.assign({}, this.cart),
      orders: [].concat(this.orders)
    };
  }
}
