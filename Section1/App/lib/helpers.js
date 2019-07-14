/*
 * Helpers for various tasks
 *
 */

// Dependencies
var config = require("./config");
var crypto = require("crypto");

// Container for all the helpers
var helpers = {};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str) {
  try {
    var obj = JSON.parse(str);
    return obj;
  } catch (e) {
    return {};
  }
};
helpers.iv = "1234567890123456";
helpers.key = crypto.createHash("sha256").digest();
helpers.cipher = crypto.createCipheriv("aes-256-cbc", helpers.key, helpers.iv);
helpers.decipher = crypto.createDecipheriv(
  "aes-256-cbc",
  helpers.key,
  helpers.iv
);
// Create a Encrypted password
helpers.encrypt = function(password) {
  if (typeof password == "string" && password.length > 0) {
    var cipherPassword = helpers.cipher.update(password, "utf-8", "hex");
    cipherPassword += helpers.cipher.final("hex");
    return cipherPassword;
  } else {
    return false;
  }
};

// Create a SHA256 hash
helpers.hash = function(password) {
  if (typeof password == "string" && password.length > 0) {
    var hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(password)
      .digest("hex");
    return hash;
  } else {
    return false;
  }
};
helpers.decrypt = function(password) {
  var decipheredPassword = helpers.decipher.update(password, "hex", "utf-8");
  decipheredPassword += helpers.decipher.final("utf-8");
  return decipheredPassword;
};

helpers.createRandomString = function(strLength) {
  strLength = typeof strLength == "number" && strLength > 0 ? strLength : false;

  if (strLength) {
    //Define all the possible char for String
    const possibleCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";
    //Start the string.
    var str = "";
    for (i = 1; i <= strLength; i++) {
      //Get random number from possibleCharacters String.
      var randomCharacter = possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length)
      );
      //Append the char to str.
      str += randomCharacter;
    }
    //Return the final str.
    return str;
  } else {
    return false;
  }
};
// Export the module
module.exports = helpers;
