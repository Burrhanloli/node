//Dependecies

//Define the Handlers
const handlers = {};
const _data = require("./data");
const helpers = require("./helpers");

const missingRequiredField = { Error: "Missing Required Fields." };
const userNotFound = { Error: "User not found." };

handlers.users = function(data, callback) {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for users subMethods
handlers._users = {};

//Users POST
//Required data - firstName, lastname, phone, password, tosAgreement.
//Optional data - none.
handlers._users.post = function(data, callback) {
  //Check if required fields are present
  var firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName
      : false;
  var lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName
      : false;
  var phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone
      : false;
  var password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  var tosAgreement =
    typeof data.payload.tosAgreement == "boolean" &&
    data.payload.tosAgreement == true
      ? true
      : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    //user does Not Exist
    _data.read("users", phone, function(err, data) {
      if (err) {
        //Hash the password
        var encryptedPassword = helpers.encrypt(password);
        var hashedPassword = helpers.hash(password);
        //Create user obj
        if (hashedPassword) {
          var userObj = {
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            password: encryptedPassword,
            hashedpassword: hashedPassword,
            tosagreement: true
          };
          _data.create("users", phone, userObj, function(err) {
            if (!err) {
              callback(200, { Success: "User successfully created." });
            } else {
              console.error(err);
              callback(500, { Error: "Could not create the new user." });
            }
          });
        } else {
          callback(400, {
            Error: "A user with that phone number already exists."
          });
        }
      } else {
        callback(500, { Error: "Could not hash user's password." });
      }
    });
  } else {
    callback(400, missingRequiredField);
  }
};

//Users GET
//Required data - phone.
//Optional data - none.
handlers._users.get = function(data, callback) {
  var phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;
  if (phone) {
    var token =
      typeof data.headers.token == "string" ? data.headers.token : false;
    // verify token valid for phone.
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
      if (tokenIsValid) {
        // Lookup the user
        _data.read("users", phone, function(err, data) {
          if (!err && data) {
            // Remove the hashed password from the user user object before returning it to the requester
            data.password = helpers.decrypt(data.password);
            delete data.hashedpassword;
            callback(200, data);
          } else {
            callback(404, userNotFound);
          }
        });
      } else {
        callback(403, {
          Error: "Missing required token in header or token is invalid."
        });
      }
    });
  } else {
    callback(400, missingRequiredField);
  }
};

//Users PUT
//Required data - phone.
//Optional data - firstName, lastname, password.(atleast one must be specified.)

handlers._users.put = function(data, callback) {
  //Check required fields
  var phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;

  // Check for optional fields
  var firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  var lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  var password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (phone) {
    if (firstName || lastName || password) {
      var token =
        typeof data.headers.token == "string" ? data.headers.token : false;
      // verify token valid for phone.
      handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
        if (tokenIsValid) {
          _data.read("users", phone, function(err, data) {
            if (!err && data) {
              if (firstName) {
                data.firstName = firstName;
              }
              if (lastName) {
                data.lastName = lastName;
              }
              if (lastName) {
                data.lastName = lastName;
              }
              if (password) {
                data.password = helpers.encrypt(password);
                data.hashedpassword = helpers.hash(password);
              }
              //store the updates
              _data.update("users", phone, data, function(err) {
                if (!err) {
                  callback(200, { Success: "User updated successfully," });
                } else {
                  console.error(err);
                  callback(500, { Error: "Could not update the user." });
                }
              });
            } else {
              callback(404, userNotFound);
            }
          });
        } else {
          callback(403, {
            Error: "Missing required token in header or token is invalid."
          });
        }
      });
    }
  } else {
    callback(400, missingRequiredField);
  }
};

//Users DELETE
//Required data - phone.
//Optional data - none.
handlers._users.delete = function(data, callback) {
  var phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;
  if (phone) {
    var token =
      typeof data.headers.token == "string" ? data.headers.token : false;
    // verify token valid for phone.
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
      if (tokenIsValid) {
        // Lookup the user
        _data.read("users", phone, function(err, data) {
          if (!err && data) {
            _data.delete("users", phone, function(err) {
              if (!err) {
                callback(200, { Success: "User Successfully deleted." });
              } else {
                callback(500, { Error: "Could not delete the user." });
              }
            });
          } else {
            callback(404, userNotFound);
          }
        });
      } else {
        callback(403, {
          Error: "Missing required token in header or token is invalid."
        });
      }
    });
  } else {
    callback(400, missingRequiredField);
  }
};

handlers.ping = function(callback) {
  callback(200, { Success: "Successfully pinged the API." });
};

//Not Fund Route
handlers.notFound = function(callback) {
  callback(404);
};
//Sample Handlers
handlers.hello = function(callback) {
  callback(200, { message: "hello world!" });
};

handlers.tokens = function(data, callback) {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

//Container for tokens
handlers._tokens = {};

//Tokens - POST
//Required data = phone, password.
//OPtional data - None.
handlers._tokens.post = function(data, callback) {
  var phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone
      : false;
  var password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (phone && password) {
    //lookup the user that matches the phone

    _data.read("users", phone, function(err, userData) {
      if (!err && userData) {
        //Hash the sent password sent by the user.
        var hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedpassword) {
          //If valid, create a new token with set Expiration 1 hour in the future.
          var tokenId = helpers.createRandomString(20);
          var expiry = Date.now() + 1000 * 60 * 60;
          var tokenObj = {
            phone: phone,
            id: tokenId,
            expiry: expiry
          };

          //Store the token
          _data.create("tokens", tokenId, tokenObj, function(err) {
            if (!err) {
              callback(200, tokenObj);
            } else {
              callback(500, { Error: "Could not create the new token." });
            }
          });
        } else {
          callback(400, { Error: "Password did not match." });
        }
      } else {
        callback(404, userNotFound);
      }
    });
  } else {
    callback(400, missingRequiredField);
  }
};

//Tokens - GET
//Required data - id.
//Optional data - none.
handlers._tokens.get = function(data, callback) {
  //Check that id is valid.
  var id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    // Lookup the user
    _data.read("tokens", id, function(err, tokenData) {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404, { Error: "Token id is invalid." });
      }
    });
  } else {
    callback(400, missingRequiredField);
  }
};

//Tokens - PUT
//Required data - id, extend.
//Optional data - none.
handlers._tokens.put = function(data, callback) {
  var id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;
  var extend =
    typeof data.payload.extend == "boolean" && data.payload.extend == true
      ? true
      : false;

  if (id && extend) {
    _data.read("tokens", id, function(err, tokenData) {
      if (!err && tokenData) {
        //check if token is'nt already active
        if (tokenData.expiry > Date.now()) {
          // Set expiry time
          tokenData.expiry = Date.now() * 1000 * 60 * 60;
          //Store the new update
          _data.update("tokens", id, tokenData, function(err) {
            if (!err) {
              callback(200, { Success: "Token succesfully extended. " });
            } else {
              callback(500, { Error: "Could not update the token expiry." });
            }
          });
        } else {
          callback(400, {
            Error: "The Token has already expired and cannot be extended."
          });
        }
      } else {
        callback(404, { Error: "Token id is invalid" });
      }
    });
  } else {
    callback(400, missingRequiredField);
  }
};

//Tokens - DELETE
handlers._tokens.delete = function(data, callback) {
  //Check that id is valid.
  var id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    _data.read("tokens", id, function(err, tokenData) {
      if (!err && tokenData) {
        //Delete token
        _data.delete("tokens", id, function(err) {
          if (!err) {
            callback(200, { Success: "Token deleted successfully." });
          } else {
            callback(500, { Error: "Could not delete then token." });
          }
        });
      } else {
        callback(404, { Error: "Token id is invalid." });
      }
    });
  } else {
    callback(400, missingRequiredField);
  }
};

//Verify if a tokenId is currently valid for a given user.
handlers._tokens.verifyToken = function(id, phone, callback) {
  _data.read("tokens", id, function(err, tokenData) {
    if (!err && tokenData) {
      //Check that the token is for the given user has not expired.
      if (tokenData.phone == phone && tokenData.expiry > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};
//Export
module.exports = handlers;
