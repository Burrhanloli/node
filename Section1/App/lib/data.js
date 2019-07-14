// Storing and editing Data

const fs = require("fs");
const path = require("path");
const helpers = require("./helpers");

//Container
var lib = {};
//file path to .data
lib.baseDir = path.join(__dirname, "/../.data/");
// Write data to file
lib.create = function(dir, file, data, callback) {
  //open file
  fs.open(getJsonFile(dir, file), "wx", function(err, fileDescriptor) {
    if (!err && fileDescriptor) {
      //convert data to string
      var stringData = JSON.stringify(data);

      //Write to file
      fs.writeFile(fileDescriptor, stringData, function(err) {
        if (!err) {
          fs.close(fileDescriptor, function(err) {
            if (!err) {
              callback(false);
            } else {
              callback("Error closing the file.");
            }
          });
        } else {
          callback("Error Writing to File.");
        }
      });
    } else {
      callback("Could not create new file, it may already exist");
    }
  });
};

//Read Data from file
lib.read = function(dir, filName, callback) {
  fs.readFile(getJsonFile(dir, filName), "utf8", function(err, data) {
    if (!err && data) {
      var parsedata = helpers.parseJsonToObject(data);
      callback(false, parsedata);
    } else {
      callback(err, data);
    }
  });
};

//Update data in file
lib.update = function(dir, file, data, callback) {
  //open file to update
  fs.open(getJsonFile(dir, file), "r+", function(err, fileDescriptor) {
    if (!err && fileDescriptor) {
      //convert data to string
      var stringData = JSON.stringify(data);
      // Truncate the file
      // Truncate the file
      fs.ftruncate(fileDescriptor, function(err) {
        if (!err) {
          // Write to file and close it
          fs.writeFile(fileDescriptor, stringData, function(err) {
            if (!err) {
              fs.close(fileDescriptor, function(err) {
                if (!err) {
                  callback(false);
                } else {
                  callback("Error closing existing file");
                }
              });
            } else {
              callback("Error writing to existing file");
            }
          });
        } else {
          callback("Error truncating file");
        }
      });
    } else {
      callback("Could not open the file for updating, file may not exist yet.");
    }
  });
};

// Delete the file
lib.delete = function(dir, filName, callback) {
  //unlick the file
  fs.unlink(getJsonFile(dir, filName), function(err) {
    if (!err) {
      callback(false);
    } else {
      callback("Error deleting the file.");
    }
  });
};

function getJsonFile(dir, filName) {
  return lib.baseDir + dir + "/" + filName + ".json";
}
// Export
module.exports = lib;
