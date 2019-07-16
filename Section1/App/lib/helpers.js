/*
 * Helpers for various tasks
 *
 */

// Dependencies
const config = require("./config");
const crypto = require("crypto");
const https = require("https");
const queryString = require("querystring");

// Container for all the helpers
const helpers = {};

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

helpers.sendTwilioSms = (phoneNo, message, callback) => {
  phoneNo =
    typeof phoneNo == "string" && phoneNo.trim().length == 10
      ? phoneNo.trim()
      : false;

  message =
    typeof message == "string" &&
    message.trim().length > 0 &&
    message.trim().length <= 1600
      ? message.trim()
      : false;

  if (phoneNo && message) {
    // Configure the request payload

    const payload = {
      From: config.twilio.fromPhone,
      To: +1 + phoneNo,
      Body: message
    };
    //Stringify.
    const stringPayload = queryString.stringify(payload);

    const requestDetails = {
      protocol: "https:",
      hostname: "api.twilio.com",
      method: "POST",
      path:
        "/2010-04-01/Accounts/" + config.twilio.accountSid + "/Messages.json",
      auth: config.twilio.accountSid + ":" + config.twilio.authToken,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(stringPayload)
      }
    };

    //Instantiate the request obj
    const req = https.request(requestDetails, res => {
      const status = res.statusCode;

      if (status == 200 || status == 201) {
        callback(false);
      } else {
        callback(status, { Error: "Status code returned was" + status });
      }
    });

    //Bind to error
    req.on("error", e => {
      callback(e);
    });

    req.write(stringPayload);

    req.end();
  } else {
    callback(500, { Error: "Given parameters where missing or invalid." });
  }
};
// Export the module
module.exports = helpers;
