// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

let dataStore = {};

/**
 * The base directory of data folder
 * @property
 * @type {string}
 */
dataStore.baseDir = path.join(__dirname, "/../.data/");

/**
 * Writes the given data to the given data file
 * @param {String} dir data directory name
 * @param {String} file data file name
 * @param {String} data data string to write to file
 * @param {Function} callback
 * @returns {Object}
 */
dataStore.create = (dir, file, data, callback) => {
  callback = typeof callback === "function" ? callback : Function.prototype;

  // Open the file for writing
  fs.open(`${dataStore.baseDir}${dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      // Convert data to string
      let stringData = JSON.stringify(data);

      // Write to file and close it
      fs.writeFile(fileDescriptor, stringData, (err) => {
        if (!err) {
          fs.close(fileDescriptor, (err) => {
            callback(!err ? null : 'Error closing new file');
          });
        } else {
          callback('Error writing to new file');
        }
      });
    } else {
      callback('Could not create new file, it may already exist');
    }
  });
  return dataStore;
};

/**
 * Reads the data from the given data file
 * @param {String} dir data directory name
 * @param {String} file data file name
 * @param {Function} callback
 * @returns {Object}
 */
dataStore.read = (dir, file, callback) => {
  callback = typeof callback === "function" ? callback : Function.prototype;

  fs.readFile(`${dataStore.baseDir}${dir}/${file}.json`, 'utf8', (err, data) => {
    if (!err && data) {
      const parsedData = helpers.parseJsonToObject(data);
      callback(false, parsedData);
    } else {
      callback(err, data);
    }
  });
  return dataStore;
};

/**
 * Update the given data file with the given data.
 * @param {String} dir data directory name
 * @param {String} file data file name
 * @param {Function} callback
 * @returns {Object}
 */
dataStore.update = (dir, file, data, callback) => {
  callback = typeof callback === "function" ? callback : Function.prototype;

  // Open the file for writing
  fs.open(`${dataStore.baseDir}${dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      // Convert data to string
      const stringData = JSON.stringify(data);

      // Truncate the file
      fs.truncate(fileDescriptor, (err) => {
        if (!err) {
          // Write to file and close it
          fs.writeFile(fileDescriptor, stringData, (err) => {
            if (!err) {
              fs.close(fileDescriptor, (err) => {
                callback(!err ? false : 'Error closing existing file');
              });
            } else {
              callback('Error writing to existing file');
            }
          });
        } else {
          callback('Error truncating file');
        }
      });
    } else {
      callback('Could not open file for updating, it may not exist yet');
    }
  });
  return dataStore;
};

/**
 * Deletes the given data from the given data file
 * @param {String} dir data directory name
 * @param {String} file data file name
 * @param {Function} callback
 * @returns {Object}
 */
dataStore.delete = (dir, file, callback) => {
  callback = typeof callback === "function" ? callback : Function.prototype;

  // Unlink the file from the filesystem
  fs.unlink(`${dataStore.baseDir}${dir}/${file}.json`, (err) => {
    callback(err);
  });
  return dataStore;
};

/**
 * Lists all the items in a directory
 * @param {String} dir data directory name
 * @param {Function} callback
 * @returns {Object}
 */
dataStore.list = (dir, callback) => {
  callback = typeof callback === "function" ? callback : Function.prototype;

  fs.readdir(`${dataStore.baseDir}${dir}/`, (err, data) => {
    if (!err && data && data.length > 0) {
      var trimmedFileNames = [];
      data.forEach((fileName) => {
        trimmedFileNames.push(fileName.replace('.json', ''));
      });
      callback(false, trimmedFileNames);
    } else {
      callback(err, data);
    }
  });
  return dataStore;
};

/**
 * Data storage module to perform CRUD operations against the file system.
 */
module.exports = Object.freeze(dataStore);
