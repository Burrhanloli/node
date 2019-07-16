// Dependencies
const _data = require("./data");
const helpers = require("./helpers");
const config = require("./config");

// Define all the handlers
const handlers = {};

// Ping
handlers.ping = function(callback) {
  callback(200);
};

// Not Found Route
handlers.notFound = function(callback) {
  callback(404);
};

// Sample Handlers
handlers.hello = function(callback) {
  callback(200, { message: "hello world!" });
};

const missingRequiredField = { Error: "Missing Required Fields." };
const userNotFound = { Error: "User not found." };

// Users
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
handlers._users.post = (data, callback) => {
  // Check that all required fields are filled out
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
  var phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
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
    // Make sure the user doesnt already exist
    _data.read("users", phone, (err, data) => {
      if (err) {
        // Hash the password
        var encryptedPassword = helpers.encrypt(password);
        var hashedPassword = helpers.hash(password);

        // Create the user object
        if (hashedPassword) {
          var userObject = {
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            password: encryptedPassword,
            hashedpassword: hashedPassword,
            tosagreement: true
          };

          // Store the user
          _data.create("users", phone, userObject, err => {
            if (!err) {
              callback(200, { Success: "User successfully created." });
            } else {
              callback(500, { Error: "Could not create the new user" });
            }
          });
        } else {
          callback(500, { Error: "Could not hash the user's password." });
        }
      } else {
        // User alread exists
        callback(400, {
          Error: "A user with that phone number already exists"
        });
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
                var userChecks =
                  typeof data.checks == "object" && data.checks instanceof Array
                    ? data.checks
                    : [];
                var checksToDelete = userChecks.length;

                if (checksToDelete > 0) {
                  var checksDeleted = 0;
                  var deletionError = false;

                  userChecks.forEach(function(checkId) {
                    _data.delete("checks", checkId, function(err) {
                      if (err) {
                        deletionError = true;
                      }
                      checksDeleted++;
                      if (checksDeleted == checksToDelete) {
                        if (!deletionError) {
                          callback(200, {
                            Success: "User checks successfully deleted."
                          });
                        } else {
                          callback(500, {
                            Error:
                              "Error encountered while deleting the user checks, All checks may not have been deleted successfully. "
                          });
                        }
                      }
                    });
                  });
                } else {
                  callback(200, { Success: "User Successfully deleted." });
                }
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

// Tokens
handlers.tokens = function(data, callback) {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

//Container for tokens subMethods
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
//Required data - id.
//Optional data - none.
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

// Checks
handlers.checks = function(data, callback) {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};

//Container for checks subMethods
handlers._checks = {};

//Checks - POST
//Required data - protocol, url, methods, successCodes, timeoutSeconds.
//Optional data - none.
handlers._checks.post = function(data, callback) {
  // Validate inputs
  var protocol =
    typeof data.payload.protocol == "string" &&
    ["https", "http"].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;
  var url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;
  var method =
    typeof data.payload.method == "string" &&
    ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;
  var successCodes =
    typeof data.payload.successCodes == "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;
  var timeoutSeconds =
    typeof data.payload.timeoutSeconds == "number" &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;
  if (protocol && url && method && successCodes && timeoutSeconds) {
    // Get token from headers
    var token =
      typeof data.headers.token == "string" ? data.headers.token : false;

    // Lookup the user phone by reading the token
    _data.read("tokens", token, function(err, tokenData) {
      if (!err && tokenData) {
        var userPhone = tokenData.phone;

        // Lookup the user data
        _data.read("users", userPhone, function(err, userData) {
          if (!err && userData) {
            var userChecks =
              typeof userData.checks == "object" &&
              userData.checks instanceof Array
                ? userData.checks
                : [];
            // Verify that user has less than the number of max-checks per user
            if (userChecks.length < config.maxChecks) {
              // Create random id for check
              var checkId = helpers.createRandomString(20);

              // Create check object including userPhone
              var checkObject = {
                id: checkId,
                userPhone: userPhone,
                protocol: protocol,
                url: url,
                method: method,
                successCodes: successCodes,
                timeoutSeconds: timeoutSeconds
              };

              // Save the object
              _data.create("checks", checkId, checkObject, function(err) {
                if (!err) {
                  // Add check id to the user's object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  // Save the new user data
                  _data.update("users", userPhone, userData, function(err) {
                    if (!err) {
                      // Return the data about the new check
                      callback(200, checkObject);
                    } else {
                      callback(500, {
                        Error: "Could not update the user with the new check."
                      });
                    }
                  });
                } else {
                  callback(500, { Error: "Could not create the new check" });
                }
              });
            } else {
              callback(400, {
                Error:
                  "The user has already consumed maximum number of checks (" +
                  config.maxChecks +
                  ") available."
              });
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      }
    });
  } else {
    callback(400, missingRequiredField);
  }
};

//Checks - GET
//Required data - id.
//Optional data - none.
handlers._checks.get = function(data, callback) {
  //Validate Required Inputs
  var id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    //lookup the check
    _data.read("checks", id, function(err, checkData) {
      if (!err && checkData) {
        var token =
          typeof data.headers.token == "string" ? data.headers.token : false;
        // verify token valid for phone.
        handlers._tokens.verifyToken(token, checkData.userPhone, function(
          tokenIsValid
        ) {
          if (tokenIsValid) {
            callback(200, checkData);
          } else {
            callback(403, {
              Error: "Missing required token in header or token is invalid."
            });
          }
        });
      } else {
        callback(404, { Error: "Check data not found." });
      }
    });
  } else {
    callback(400, missingRequiredField);
  }
};

//Checks - PUT
//Required data - id.
//Optional data - protocol, url, methods, successCodes, timeoutSeconds (atleast one should be present).
handlers._checks.put = function(data, callback) {
  //Validate Required Inputs
  var id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;

  // Validate Optional Input
  var protocol =
    typeof data.payload.protocol == "string" &&
    ["https", "http"].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;
  var url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;
  var method =
    typeof data.payload.method == "string" &&
    ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;
  var successCodes =
    typeof data.payload.successCodes == "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;
  var timeoutSeconds =
    typeof data.payload.timeoutSeconds == "number" &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;
  if (id) {
    if (protocol || url || method || successCodes || timeoutSeconds) {
      _data.read("checks", id, function(err, checkData) {
        if (!err && checkData) {
          var token =
            typeof data.headers.token == "string" ? data.headers.token : false;
          // verify token valid for phone.
          handlers._tokens.verifyToken(token, checkData.userPhone, function(
            tokenIsValid
          ) {
            if (tokenIsValid) {
              if (protocol) {
                checkData.protocol = protocol;
              }
              if (url) {
                checkData.url = url;
              }
              if (method) {
                checkData.method = method;
              }
              if (successCodes) {
                checkData.successCodes = successCodes;
              }
              if (timeoutSeconds) {
                checkData.timeoutSeconds = timeoutSeconds;
              }

              _data.update("checks", id, checkData, function(err) {
                if (!err) {
                  callback(200, { Success: "Check successfully updated." });
                } else {
                  callback(500, { Error: "Could not update the check." });
                }
              });
            } else {
              callback(403, {
                Error: "Missing required token in header or token is invalid."
              });
            }
          });
        } else {
          callback(400, { Error: "Check Id not found" });
        }
      });
    }
  } else {
    callback(400, missingRequiredField);
  }
};

//Checks - DELETE
//Required data - id.
//Optional data - none
handlers._checks.delete = function(data, callback) {
  // Check that id is valid
  var id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    // Lookup the check
    _data.read("checks", id, function(err, checkData) {
      if (!err && checkData) {
        // Get the token that sent the request
        var token =
          typeof data.headers.token == "string" ? data.headers.token : false;
        // Verify that the given token is valid and belongs to the user who created the check
        handlers._tokens.verifyToken(token, checkData.userPhone, function(
          tokenIsValid
        ) {
          if (tokenIsValid) {
            // Delete the check data
            _data.delete("checks", id, function(err) {
              if (!err) {
                // Lookup the user's object to get all their checks
                _data.read("users", checkData.userPhone, function(
                  err,
                  userData
                ) {
                  if (!err) {
                    var userChecks =
                      typeof userData.checks == "object" &&
                      userData.checks instanceof Array
                        ? userData.checks
                        : [];

                    // Remove the deleted check from their list of checks
                    var checkPosition = userChecks.indexOf(id);
                    if (checkPosition > -1) {
                      userChecks.splice(checkPosition, 1);
                      // Re-save the user's data
                      userData.checks = userChecks;
                      _data.update(
                        "users",
                        checkData.userPhone,
                        userData,
                        function(err) {
                          if (!err) {
                            callback(200, {
                              Success: "User check successfully deleted."
                            });
                          } else {
                            callback(500, {
                              Error: "Could not delete the user check."
                            });
                          }
                        }
                      );
                    } else {
                      callback(500, {
                        Error:
                          "Could not find the check on the user's object, so could not remove it."
                      });
                    }
                  } else {
                    callback(500, {
                      Error:
                        "Could not find the user who created the check, so could not remove the check from the list of checks on their user object."
                    });
                  }
                });
              } else {
                callback(500, { Error: "Could not delete the check data." });
              }
            });
          } else {
            callback(403);
          }
        });
      } else {
        callback(400, { Error: "The check ID specified could not be found" });
      }
    });
  } else {
    callback(400, missingRequiredField);
  }
};

//Export
module.exports = handlers;
