//Dependecies

//Define the Handlers
const handlers = {};
const _data = require("./data");
const helpers = require("./helpers");

const missingRequiredField = { Error: "Missing Required Fields." };
const userNotFOund = { Error: "User not found." };

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
// TODO - only authenticated user should access their object.
handlers._users.get = function(data, callback) {
  var phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;
  if (phone) {
    // Lookup the user
    _data.read("users", phone, function(err, data) {
      if (!err && data) {
        // Remove the hashed password from the user user object before returning it to the requester
        data.password = helpers.decrypt(data.password);
        delete data.hashedpassword;
        callback(200, data);
      } else {
        callback(404, userNotFOund);
      }
    });
  } else {
    callback(400, missingRequiredField);
  }
};

//Users PUT
//Required data - phone.
//Optional data - firstName, lastname, password.(atleast one must be specified.)
// TODO - only authenticated user should access their object.
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
          callback(404, userNotFOund);
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
// TODO - only authenticated user should access their object.
// TODO - cleanup (delete) any other data files associated with the user.
handlers._users.delete = function(data, callback) {
  var phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;
  if (phone) {
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
        callback(404, userNotFOund);
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

//Export
module.exports = handlers;
