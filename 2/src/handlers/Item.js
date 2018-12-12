// Dependencies
const helpers = require("../helpers");
const dataStore = require("../dataStore");

/**
 * Defines and implements the CRUD operations for items, as well as the functionality
 * to easily serialize/de-serialize, validate and manipulate `item` data.
 * @class Item
 */
module.exports = class Item {
  /**
   * HTTP Request handler for the Items. It handles the HTTP method `get` only. The `post`, `put` and `delete` methods will not be exposed over the REST API.
   * @param {Object} data 
   * @param {String} data.path Recognized paths: `items`
   * @param {Object} data.queryParams
   * @param {Object} data.headers
   * @param {Object} data.payload
   * @param {String} data.method The HTTP method ['get']. Methods like ['post' | 'put' | 'delete'] not exposed over the REST API.
   * @param {Function} callback 
   */
  static httpRequestHandler (data, callback) {
    data = data && typeof data === "object" ? data : {};
    callback = typeof callback === "function" ? callback : Function.prototype;

    // const acceptedMethods = ['post', 'get', 'put', 'delete'];
    const acceptedMethods = ['get']; // Users can only read (GET) the items. Methods like ['post' | 'put' | 'delete'] not exposed over the REST API
    const method = typeof data.method === "string" ? data.method.trim().toLowerCase() : "";
    if (acceptedMethods.indexOf(method) > -1) {
      Item[method](data, callback);
    } else {
      callback(405);
    }
    return Item;
  }

  /**
   * Creates and stores a new Item.
   * @param {Object} data 
   * @param {Object} data.payload
   * @param {String} data.payload.name 
   * @param {String} data.payload.unitPrice 
   * @param {String} [data.payload.imageURL] 
   * @param {String} [data.payload.description] 
   * @param {Function} callback 
   */
  static post (data, callback) {
    data = data && typeof data === "object" ? data : {};
    callback = typeof callback === "function" ? callback : Function.prototype;

    // Check that all required fields are filled out
    const name = typeof data.payload.name === 'string' && data.payload.name.trim().length ? data.payload.name.trim() : false;
    const unitPrice = Item.isValidPrice(Number(data.payload.unitPrice)) ? Number(data.payload.unitPrice) : false;
    const description = data.payload.description;
    const imageURL = data.payload.imageURL;

    if (name && unitPrice) {
      // Define item ID
      const id = Item.createUniqueId();

      // Make sure the item doesn't already exist
      dataStore.read('items', id, (err, data) => {
        if (err) {
          // Create and store the new item object
          const itemData = new Item({
            id: id,
            name: name,
            description: description,
            imageURL: imageURL,
            unitPrice: unitPrice
          }).toJSON();

          dataStore.create('items', id, itemData, (err) => {
            if (!err) {
              callback(200, itemData);
            } else {
              callback(500, { 'Error': 'Could not create the new item' });
            }
          });
        } else {
          callback(400, { 'Error': 'A item with this id already exists' });
        }
      });
    } else {
      callback(400, { 'Error': 'Missing required fields' });
    }
    return Item;
  }

  /**
   * Retrieves and calls back with an existing item.
   * @param {Object} data 
   * @param {Object} data.headers
   * @param {Object} data.queryParams
   * @param {String} [data.queryParams.id] if not provided, will return the entire list of items
   * @param {Function} callback 
   */
  static get (data, callback) {
    data = data && typeof data === "object" ? data : {};
    callback = typeof callback === "function" ? callback : Function.prototype;

    // Check that id is valid
    const id = Item.isValidId(data.queryParams.id) ? data.queryParams.id.trim() : false;
    if (id) {
      // Lookup the item
      dataStore.read('items', id, (err, data) => {
        if (!err && data) {
          callback(200, new Item(data).toJSON());
        } else {
          callback(404, { 'Error': 'Cannot find an item with the given ID' });
        }
      });
    } else {
      // callback(400, { 'Error': 'Missing required field' });
      Item.list(callback);
    }
    return Item;
  }

  /**
   * Updates or modifies an existing item.
   * @param {Object} data 
   * @param {Object} data.payload
   * @param {String} data.payload.id 
   * @param {String} [data.payload.name] 
   * @param {String} [data.payload.unitPrice] 
   * @param {String} [data.payload.description] 
   * @param {String} [data.payload.imageURL] 
   * @param {Function} callback 
   */
  static put (data, callback) {
    data = data && typeof data === "object" ? data : {};
    callback = typeof callback === "function" ? callback : Function.prototype;

    // Check for required field
    const id = Item.isValidId(data.payload.id) ? data.payload.id.trim() : false;

    // Error if id is invalid
    if (id) {
      // Check for optional fields
      const name = typeof (data.payload.name) === 'string' && data.payload.name.trim().length ? data.payload.name.trim() : false;
      const description = typeof (data.payload.description) === 'string' && data.payload.description.trim().length ? data.payload.description.trim() : false;
      const imageURL = typeof (data.payload.imageURL) === 'string' && data.payload.imageURL.trim().length ? data.payload.imageURL.trim() : false;
      const unitPrice = Item.isValidPrice(Number(data.payload.unitPrice)) ? Number(data.payload.unitPrice) : false;

      // Error if nothing is sent to update
      if (name || description || imageURL || unitPrice) {
        // Lookup the item
        dataStore.read('items', id, (err, itemData) => {
          if (!err && itemData) {
            // Update the fields if necessary
            if (name) {
              itemData.name = name;
            }
            if (unitPrice) {
              itemData.unitPrice = unitPrice;
            }
            if (description) {
              itemData.description = description;
            }
            if (imageURL) {
              itemData.imageURL = imageURL;
            }

            // Store the new updates
            itemData = new Item(itemData).toJSON();

            if (itemData.id === id) {
              dataStore.update('items', id, itemData, (err) => {
                if (!err) {
                  callback(200, itemData);
                } else {
                  callback(500, { 'Error': 'Could not update the specified item.' });
                }
              });
            } else {
              callback(400, { 'Error': 'Could not update the specified item' });
            }
          } else {
            callback(400, { 'Error': 'Specified item does not exist.' });
          }
        });
      } else {
        callback(400, { 'Error': 'Missing fields to update.' });
      }
    } else {
      callback(400, { 'Error': 'Missing required field.' });
    }
    return Item;
  }

  /**
   * Deletes an existing item.
   * @param {Object} data 
   * @param {Object} data.queryParams
   * @param {String} data.queryParams.id 
   * @param {Function} callback 
   */
  static delete (data, callback) {
    data = data && typeof data === "object" ? data : {};
    callback = typeof callback === "function" ? callback : Function.prototype;

    // Check that id number is valid
    const id = Item.isValidId(data.queryParams.id) ? data.queryParams.id.trim() : false;
    if (id) {
      // Lookup the item
      dataStore.read('items', id, (err, itemData) => {
        if (!err && itemData) {
          const item = new Item(itemData);

          if (item.id === id) {
            // Delete the item's data
            dataStore.delete('items', id, (err) => {
              if (!err) {
                callback(200, true);
              } else {
                callback(400, { 'Error': 'Could not delete the specified item' });
              }
            });
          } else {
            callback(400, { 'Error': 'Could not find the specified item.' });
          }
        } else {
          callback(400, { 'Error': 'Could not find the specified item.' });
        }
      });
    } else {
      callback(400, { 'Error': 'Missing required field' })
    }
    return Item;
  }

  /**
   * Loads and returns (calls back with) an array containing all existing items.
   * @param {Function} callback 
   */
  static list (callback) {
    callback = typeof callback === "function" ? callback : Function.prototype;

    // get all item IDs
    dataStore.list("items", (err, data) => {
      if (!err && data instanceof Array) {
        const itemCount = data.length;
        const items = [];

        // for each item id
        data.forEach((itemId) => {
          // load the item data
          dataStore.read('items', itemId, (err, itemData) => {
            if (!err) {
              items.push(new Item(itemData).toJSON());

              if (items.length === itemCount) {
                callback(200, items);
              }
            }
          });
        });
      } else {
        callback(500, { "Error": "Unable to load the list of items" });
      }
    });
    return Item;
  }

  /**
   * Loads and returns (calls back with) a hashmap containing all existing items.
   * @param {Function} callback 
   */
  static hashmap (callback) {
    callback = typeof callback === "function" ? callback : Function.prototype;

    // get all item IDs
    dataStore.list("items", (err, data) => {
      if (!err && data instanceof Array) {
        const itemCount = data.length;
        const items = {};

        // for each item id
        data.forEach((itemId) => {
          // load the item data
          dataStore.read('items', itemId, (err, itemData) => {
            if (!err) {
              items[itemId] = new Item(itemData).toJSON();

              if (Object.keys(items).length === itemCount) {
                callback(200, items);
              }
            }
          });
        });
      } else {
        callback(500, { "Error": "Unable to load the list of items" });
      }
    });
    return Item;
  }

  /**
   * Creates and returns a 20 characters long string, as unique id.
   * @static
   * @returns {String}
   * @memberof Token
   */
  static createUniqueId () {
    return helpers.createRandomString(10);
  }

  /**
   * Returns `true` if the given value has a valid token DI format, or `false` otherwise.
   * @static
   * @param {String} value
   * @returns {Boolean}
   * @memberof Token
   */
  static isValidId (value) {
    return helpers.isValidItemId(value);
  }

  /**
   * Returns `true` if the given value is a valid price, or `false` otherwise.
   * @static
   * @param {Number} value
   * @returns {Boolean}
   * @memberof Token
   */
  static isValidPrice (value) {
    return typeof value === "number" && value > 0;
  }

  /**
   * Creates an instance of Item.
   * @constructor
   * @param {Object} params
   * @param {String} params.id The ID of this item
   * @param {String} params.name
   * @param {String} [params.description]
   * @param {String} params.unitPrice
   * @memberof Item
   */
  constructor(params) {
    params = params instanceof Object ? params : {};
    this.id = params.id;
    this.name = params.name;
    this.description = params.description;
    this.imageURL = params.imageURL;
    this.unitPrice = params.unitPrice;
  }

  /**
   * The item ID
   * @property
   * @type {String}
   * @memberof Token.prototype
   */
  set id (value) {
    if (Item.isValidId(value)) {
      this._id = value.trim();
    }
    return this;
  }
  get id () {
    return this._id || null;
  }

  /**
   * The name of this item.
   * @property
   * @type {String}
   * @memberof Token.prototype
   */
  set name (value) {
    this._name = typeof value === "string" ? value.trim() : "";
    return this;
  }
  get name () {
    return this._name;
  }

  /**
   * The description of this item.
   * @property
   * @type {String}
   * @memberof Token.prototype
   */
  set description (value) {
    this._description = typeof value === "string" ? value.trim() : "";
    return this;
  }
  get description () {
    return this._description;
  }

  /**
   * The URL for an image of this item
   * @property
   * @type {String}
   * @memberof Token.prototype
   */
  set imageURL (value) {
    this._imageURL = typeof value === "string" ? value.trim() : "";
    return this;
  }
  get imageURL () {
    return this._imageURL;
  }

  /**
   * The price per unit of this item in USD.
   * @property
   * @type {Number}
   * @memberof Token.prototype
   */
  set unitPrice (value) {
    this._unitPrice = Item.isValidPrice(value) ? value : 0.0;
    return this;
  }
  get unitPrice () {
    return this._unitPrice || 0.0;
  }

  /**
   * Returns a JSON object containing this item's internal state.
   * @public
   * @returns {Object}
   * @memberof Token.prototype
   */
  toJSON () {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      imageURL: this.imageURL,
      unitPrice: this.unitPrice
    };
  }
}
