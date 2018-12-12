// Dependencies
const querystring = require('querystring');
const config = require('../config');
const dataStore = require('../dataStore');
const helpers = require('../helpers');
const Token = require('./Token');
// const User = require('./User');
const Item = require('./Item');

/**
 * Defines and implements the CRUD operations for orders, as well as the functionality
 * to easily serialize/de-serialize, validate and manipulate `order` data.
 * @class Order
 */
class Order {
  /**
   * HTTP Request handler for the Orders. It handles the HTTP `get`, `post`, `put` and `delete` methods.
   * @param {Object} data 
   * @param {String} data.path Recognized paths: `orders`
   * @param {Object} data.queryParams
   * @param {Object} data.headers
   * @param {Object} data.payload
   * @param {String} data.method The HTTP method [ 'get' | 'post' | 'put' | 'delete']
   * @param {Function} callback 
   */
  static httpRequestHandler (data, callback) {
    data = data && typeof data === "object" ? data : {};
    callback = typeof callback === "function" ? callback : Function.prototype;

    const acceptedMethods = ['post', 'get', 'put', 'delete'];
    const method = typeof data.method === "string" ? data.method.trim().toLowerCase() : "";
    if (acceptedMethods.indexOf(method) > -1) {
      Order[method](data, callback);
    } else {
      callback(405);
    }
    return Order;
  }

  /**
   * Creates and stores a new Order.
   * @param {Object} data 
   * @param {Object} data.payload
   * @param {String} data.payload.email 
   * @param {String} data.payload.items  A hash-map of key-value pairs, where the 'key' is the 'itemId' and the 'value' is the quantity.
   * @param {Function} callback 
   */
  static post (data, callback) {
    data = data && typeof data === "object" ? data : {};
    data.payload = typeof data.payload === "object" ? data.payload : {};
    callback = typeof callback === "function" ? callback : Function.prototype;

    // Check that email is valid
    const email = Order.isValidEmail(data.payload.email) ? data.payload.email.trim() : false;

    if (email) {
      // retrieve the list of items
      Item.list((statusCode, items) => {
        const cartItems = typeof data.payload.items === "object" ? data.payload.items : {};
        const itemIDs = items.reduce((arr, item) => {
          arr.push(item.id);
          return arr;
        }, []);

        // remove all keys that are not valid item IDs
        Object.keys(cartItems).forEach((cartItem) => {
          if (itemIDs.indexOf(cartItem) < 0) {
            delete cartItems[cartItem];
          }
        });

        // if there are any items in the cart create a new order, otherwise don't
        if (Object.keys(cartItems).length > 0) {
          const order = new Order({
            id: Order.createUniqueId(),
            email: email,
            items: cartItems
          })
          const orderData = order.toJSON();

          // Store the order
          dataStore.create('orders', order.id, orderData, (err) => {
            if (!err) {
              // callback with the new order data
              callback(200, orderData);
            } else {
              callback(500, { 'Error': 'Could not create the new order' });
            }
          });
        } else {
          callback(400, { "Error": "Cannot create order. User's cart is empty" });
        }
      });
    } else {
      callback(400, { 'Error': 'Missing required field' })
    }
    return Order;
  }

  /**
   * Retrieves and calls back with an existing order or with the entire collection of existing orders, if no order ID is given.
   * @param {Object} data 
   * @param {Object} data.headers
   * @param {Object} data.queryParams
   * @param {String} [data.queryParams.id]
   * @param {Function} callback 
   */
  static get (data, callback) {
    data = data && typeof data === "object" ? data : {};
    data.queryParams = data.queryParams && typeof data.queryParams === "object" ? data.queryParams : {};
    callback = typeof callback === "function" ? callback : Function.prototype;

    // Check that id is valid
    const id = Order.isValidOrderId(data.queryParams.id) ? data.queryParams.id.trim() : false;
    if (id) {
      // Lookup the order
      dataStore.read('orders', id, (err, data) => {
        if (!err && data) {
          callback(200, new Order(data).toJSON());
        } else {
          callback(404, { 'Error': 'Cannot find an order with the given ID' });
        }
      });
    } else {
      // callback(400, { 'Error': 'Missing required field' });
      Order.list(callback);
    }
    return Order;
  }

  /**
   * Updates or modifies an existing order.
   * @param {Object} data 
   * @param {Object} data.payload
   * @param {String} data.payload.id 
   * @param {String} [data.payload.email] 
   * @param {Object} [data.payload.items]  A hash-map key-value pairs, where the 'key' is the 'itemId' and the 'value' is the quantity.
   * @param {Number} [data.payload.completedOn] 
   * @param {Object} [data.payload.paymentInfo] 
   * @param {Number} [data.payload.total] 
   * @param {Function} callback 
   */
  static put (data, callback) {
    data = data && typeof data === "object" ? data : {};
    callback = typeof callback === "function" ? callback : Function.prototype;

    // Check for required field
    const id = Order.isValidOrderId(data.payload.id.trim()) ? data.payload.id.trim() : false;

    // Error if id is invalid
    if (id) {

      // Check for optional fields
      const email = Order.isValidEmail(data.payload.email) ? data.payload.email.trim() : false;
      const completedOn = typeof data.payload.completedOn === "number" ? data.payload.completedOn : false;
      const paymentInfo = typeof data.payload.paymentInfo === "object" ? data.payload.paymentInfo : false;
      const total = typeof data.payload.total === "number" ? data.payload.total : false;

      // retrieve the list of items
      Item.list((statusCode, items) => {
        const cartItems = typeof data.payload.items === "object" ? data.payload.items : {};
        const itemIDs = items.reduce((arr, item) => {
          arr.push(item.id);
          return arr;
        }, []);

        // remove all keys that are not valid item IDs
        Object.keys(cartItems).forEach((cartItem) => {
          if (itemIDs.indexOf(cartItem) < 0) {
            delete cartItems[cartItem];
          }
        });

        // Error if nothing is sent to update
        if (email || completedOn || paymentInfo || total > 0 || Object.keys(cartItems).length > 0) {
          // Lookup the order
          dataStore.read('orders', id, (err, orderData) => {
            if (!err && orderData) {
              // Update the fields if necessary
              if (email) {
                orderData.email = email;
              }
              if (completedOn) {
                orderData.completedOn = completedOn;
              }
              if (paymentInfo) {
                orderData.paymentInfo = paymentInfo;
              }
              if (total) {
                orderData.total = total;
              }
              if (Object.keys(cartItems).length > 0) {
                orderData.items = cartItems;
              }

              // Store the new updates
              const order = new Order(orderData);
              if (order.id === id) {
                dataStore.update('orders', id, order.toJSON(), (err) => {
                  if (!err) {
                    callback(200, order.toJSON());
                  } else {
                    callback(500, { 'Error': 'Could not update the specified order.' });
                  }
                });
              } else {
                callback(400, { 'Error': 'Could not update the specified order' });
              }
            } else {
              callback(400, { 'Error': 'Specified order does not exist.' });
            }
          });
        } else {
          callback(400, { 'Error': 'Missing fields to update.' });
        }
      });
    } else {
      callback(400, { 'Error': 'Missing required field.' });
    }
    return Order;
  }

  /**
   * Deletes an existing Order.
   * @param {Object} data 
   * @param {Object} data.queryParams
   * @param {String} data.queryParams.id 
   * @param {Function} callback 
   */
  static delete (data, callback) {
    data = data && typeof data === "object" ? data : {};
    callback = typeof callback === "function" ? callback : Function.prototype;

    // Check that id number is valid
    const id = Order.isValidOrderId(data.queryParams.id) ? data.queryParams.id.trim() : false;
    if (id) {
      // Lookup the order
      dataStore.read('orders', id, (err, orderData) => {
        if (!err && orderData) {
          const order = new Order(orderData);

          if (order.id === id) {
            // Delete the order's data
            dataStore.delete('orders', id, (err) => {
              if (!err) {
                callback(200, order.toJSON());
              } else {
                callback(400, { 'Error': 'Could not delete the specified order' });
              }
            });
          } else {
            callback(400, { 'Error': 'Could not find the specified order.' });
          }
        } else {
          callback(400, { 'Error': 'Could not find the specified order.' });
        }
      });
    } else {
      callback(400, { 'Error': 'Missing required field' })
    }
    return Order;
  }

  /**
   * Loads and returns (calls back with) an array containing all existing orders.
   * @param {Function} callback 
   */
  static list (callback) {
    callback = typeof callback === "function" ? callback : Function.prototype;

    // get all order IDs
    dataStore.list("orders", (err, data) => {
      if (!err && data instanceof Array) {
        const orderCount = data.length;
        const orders = [];

        // for each order id
        data.forEach((orderId) => {
          // load the order data
          dataStore.read('orders', orderId, (err, orderData) => {
            if (!err) {
              orders.push(new Order(orderData).toJSON());

              if (orders.length === orderCount) {
                callback(200, orders);
              }
            }
          });
        });
      } else {
        callback(500, { "Error": "Unable to load the list of orders" });
      }
    });
    return Order;
  }

  /**
   * Returns `true` if the given value has a valid email format, or `false` otherwise.
   * @static
   * @param {String} value
   * @returns {Boolean}
   * @memberof Order
   */
  static isValidEmail (value) {
    return helpers.isValidEmail(value);
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
   * Returns `true` if the given value has a valid order ID, or `false` otherwise.
   * @static
   * @param {String} value
   * @returns {Boolean}
   * @memberof Order
   */
  static isValidOrderId (value) {
    return helpers.isValidOrderId(value);
  }

  /**
   * Creates an instance of Token.
   * @constructor
   * @param {Object} params
   * @param {String} params.email The ID (email) of the user that owns it
   * @param {String} params.id Its own 20 chars long 
   * @param {Number} params.createdOn 'Created On' timestamp
   * @param {Number} params.createdOn 'Completed On' timestamp
   * @param {String} params.paymentInfo The payment info 
   * @param {Number} params.total total
   * @param {Object} [params.items] A hash-map key-value pairs, where the 'key' is the 'itemId' and the 'value' is the quantity.
   * @memberof Order.prototype
   */
  constructor(params) {
    params = params instanceof Object ? params : {};
    this.id = params.id;
    this.email = params.email;
    this.createdOn = typeof params.createdOn === "number" ? params.createdOn : Date.now();
    this.completedOn = typeof params.completedOn === "number" && params.completedOn >= this.createdOn ? params.completedOn : null;
    this.paymentInfo = params.paymentInfo && (typeof params.paymentInfo === "string" || typeof params.paymentInfo === "object") ? params.paymentInfo : null;
    this.total = typeof params.total === "number" && params.total >= 0 ? params.total : 0.0;
    this.items = typeof params.items === "object" ? params.items : {};
  }

  /**
   * "Created On" timestamp (the date and time when it was created)
   * @property
   * @type {Number}
   * @memberof Order.prototype
   */
  set createdOn (value) {
    if (typeof value === "number") {
      this._createdOn = value;
    }
    return this;
  }
  get createdOn () {
    return this._createdOn;
  }

  /**
   * "Completed On" timestamp (the date and time when it was paid in full)
   * @property
   * @type {Number}
   * @memberof Order.prototype
   */
  set completedOn (value) {
    if (typeof value === "number" && value >= this._createdOn) {
      this._completedOn = value;
    }
    return this;
  }
  get completedOn () {
    return this._completedOn;
  }

  /**
   * User's email (ID)
   * @property
   * @type {String}
   * @memberof Order.prototype
   */
  set email (value) {
    if (Order.isValidEmail(value)) {
      this._email = value.trim();
    }
    return this;
  }
  get email () {
    return this._email || null;
  }

  /**
   * Token ID
   * @property
   * @type {String}
   * @memberof Token.prototype
   */
  set id (value) {
    if (Order.isValidOrderId(value)) {
      this._id = value.trim();
    }
    return this;
  }
  get id () {
    return this._id || null;
  }

  /**
   * Payment Info
   * @property
   * @type {String|Object}
   * @memberof Token.prototype
   */
  set paymentInfo (value) {
    this._paymentInfo = value && (typeof value === "string" || typeof value === "object") ? value : null;
    return this;
  }
  get paymentInfo () {
    return this._paymentInfo;
  }

  /**
   * Total
   * @property
   * @type {Number}
   * @memberof Order.prototype
   */
  set total (value) {
    if (typeof value === "number" && value >= 0) {
      this._total = value;
    }
    return this;
  }
  get total () {
    return this._total;
  }

  /**
   * A hash-map items (the keys) and quantities (their values).
   * @property
   * @type {Object}
   * @memberof Order.prototype
   */
  set items (value) {
    if (value && typeof value === "object") {
      let valid = true;
      // check if the value has any keys and they are all valid Item IDs.
      Object.keys(value).forEach((key) => {
        if (!Item.isValidId(key)) {
          valid = false;
        }
      });
      // if the value has any keys that are not valid Item IDs, discard it
      this._items = valid ? value : this._items;
    }
    return this;
  }
  get items () {
    return this._items;
  }

  /**
   * Process the payment and complete the order
   * @param {Object} options 
   * @param {String} [options.stripeToken=tok_visa] One of these: `tok_visa`, `tok_visa_debit`, `tok_mastercard`, `tok_mastercard_debit`, `tok_mastercard_prepaid`, `tok_amex`, `tok_discover`, `tok_diners`, `tok_jcb`, `tok_unionpay`
   * @param {Function} callback 
   */
  complete (options, callback) {
    options = options || {};
    callback = typeof callback === "function" ? callback : Function.prototype;

    // 1.a. if the order is already paid do not double charge
    if (this.completedOn && this.createdOn <= this.completedOn) {
      callback(200, { Info: "Order already completed", completedOn: this.completedOn });
      return this;
    }

    // 1.b. (otherwise) retrieve the list (the hashmap) of all items
    Item.hashmap((statusCode, items) => {
      // 2.a. get this order's items
      const orderItemsMap = this.items;

      // 3.a. get total
      const total = Object.keys(orderItemsMap).reduce((sum, cartItem) => {
        if (items[cartItem]) {
          sum += items[cartItem].unitPrice * orderItemsMap[cartItem];
        }
        return sum;
      }, 0);

      // 2.d. Error if the order items list is empty
      if (total > 0) {
        // 3. make payment
        this.total = total;
        this.makePayment(options, (err, paymentResult) => {
          if (!err) {
            const payment = JSON.parse(paymentResult);
            if (payment.object === "charge" && payment.paid && payment.status === "succeeded") {
              // update order info
              this.paymentInfo = payment;
              this.completedOn = Date.now();

              Order.put({ payload: this.toJSON() }, (orderStatusCode, orderData) => {
                this.sendInvoice((statusCode, invoice) => {
                  if (statusCode) {
                    callback(orderStatusCode, { orderData: orderData, info: `Receipt mailed to ${this.email}` });
                  } else {
                    callback(statusCode, invoice);
                  }
                });
              });
            } else {
              callback(400, { Error: "Payment failed.", paymentDetails: payment });
            }
          } else {
            callback(400, err);
          }
        });
      } else {
        callback(400, { 'Error': 'This order contains no items.' });
      }
    });
    return this;
  }

  /**
   * @param {Object} options 
   * @param {String} [options.stripeToken=tok_visa] One of these: `tok_visa`, `tok_visa_debit`, `tok_mastercard`, `tok_mastercard_debit`, `tok_mastercard_prepaid`, `tok_amex`, `tok_discover`, `tok_diners`, `tok_jcb`, `tok_unionpay`
   * @param {Function} callback 
   */
  makePayment (options, callback) {
    options = options || {};
    const price = this.total;
    if (typeof price === "number" && price > 0) {
      // Create Payload
      const stringPayload = querystring.stringify({
        amount: price * 100,
        currency: "USD",
        source: options.stripeToken || "tok_visa"
      });

      // Configure request details
      const requestDetails = {
        protocol: "https:",
        hostname: "api.stripe.com",
        port: 443,
        method: "POST",
        path: "/v1/charges",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
          "Authorization": "Bearer " + config.stripe.secretKey
        }
      };

      helpers.ajax(requestDetails, stringPayload, (err, paymentInfo) => {
        callback(err, paymentInfo);
      });
    } else {
      callback({ Error: "Invalid payment amount" });
    }
  }

  sendInvoice (callback) {
    Item.hashmap((statusCode, items) => {
      let item;
      if (statusCode === 200) {
        // Create Payload
        const payload = {
          from: `PizzaApp<${config.mailgun.domain}>`,
          to: this.email,
          subject: `Order Invoice - ${this.id}`,
          html: `<h1>Invoice</h1>
          <h5>Your order #${this.id} has been placed successfully</h5>
          <p>Details</p><hr/>
          <ul>
            <li><span>Order ID: </span><strong>${this.id}</strong></li>
            <li><span>User ID: </span><strong>${this.email}</strong></li>
            <li><span>Created On: </span><strong>${new Date(this.createdOn).toLocaleString()}</strong></li>
            <li><span>Completed On: </span><strong>${new Date(this.completedOn).toLocaleString()}</strong></li>
          </ul>
          <p>Items</p><hr/>
          <table>
            <tr><th>Name</th><th>ID</th><th>Description</th><th>PPU ($)</th><th>Quantity</th></tr>
            ${Object.keys(this.items).map((itemId) => {
              item = items[itemId];
              return `<tr><th>${item.name}</th><th>${item.id}</th><th>${item.description}</th><th>${item.unitPrice}</th><th>${this.items[itemId]}</th></tr>`;
            })}
          </table>
          <p><span>Total: </span><strong>${this.total}</strong></p>`
        };

        const stringPayload = querystring.stringify(payload);

        // Configure request details
        const requestDetails = {
          protocol: "https:",
          hostname: "api.mailgun.net",
          method: "POST",
          auth: `api:${config.mailgun.apiKey}`,
          path: `/v3/${config.mailgun.domain}/messages`,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
          }
        };

        helpers.ajax(requestDetails, stringPayload, callback);
      } else {
        callback(statusCode, items);
      }
    });
    return this;
  }


  /**
   * Returns a JSON object containing order's internal state.
   * @public
   * @returns {Object}
   * @memberof Order.prototype
   */
  toJSON () {
    return {
      id: this.id,
      email: this.email,
      createdOn: this.createdOn,
      completedOn: this.completedOn,
      paymentInfo: this.paymentInfo,
      total: this.total,
      items: Object.assign({}, this.items)
    };
  }
}

module.exports = Order;