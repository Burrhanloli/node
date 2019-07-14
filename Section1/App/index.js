// Pro=imary File for the API

// Dependencies
const http = require("http");
const https = require("https");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;
const config = require("./lib/config");
const fs = require("fs");
const _data = require("./lib/data");
const handlers = require("./lib/handlers");
const helpers = require("./lib/helpers");

// Instantioating the http server
var httpServer = http.createServer(function(request, respond) {
  unifiedServer(request, respond);
});

// Start the http the server
httpServer.listen(config.httpPort, function() {
  console.log(
    "The server is Listening on port " +
      config.httpPort +
      " in " +
      config.envName +
      " mode"
  );
});

// Instantioating the https server
var httpsServerOptions = {
  key: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/cert.pem")
};
var httpsServer = https.createServer(httpsServerOptions, function(
  request,
  respond
) {
  unifiedServer(request, respond);
});

// Start the http the server
httpsServer.listen(config.httpsPort, function() {
  console.log(
    "The server is Listening on port " +
      config.httpsPort +
      " in " +
      config.envName +
      " mode"
  );
});

//Unified server logic for both http and https
var unifiedServer = function(request, response) {
  //Get the URL and parse it
  var parsedUrl = url.parse(request.url, true);

  //Get the path from the URL
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, "");

  //Get the query string as object
  var queryStringObject = parsedUrl.query;

  // Get the HTTP Method
  var method = request.method.toLowerCase();

  //Get the Headers as an object
  var headers = request.headers;

  //Get the payload
  var decoder = new StringDecoder("utf-8");

  var buffer = "";
  request.on("data", function(data) {
    buffer += decoder.write(data);
  });
  request.on("end", function() {
    buffer += decoder.end();

    //Choose the handler here
    var chosenHandler =
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound;

    //Construct the data object
    var data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method,
      headers: headers,
      payload: helpers.parseJsonToObject(buffer)
    };

    //Route the request
    chosenHandler(data, function(statusCode, payload) {
      statusCode = typeof statusCode == "number" ? statusCode : 200;
      payload = typeof payload == "object" ? payload : {};

      var payloadString = JSON.stringify(payload);

      //return the response
      response.setHeader("Content-Type", "application/json");
      response.writeHead(statusCode);
      response.end(payloadString);

      //Log the request path
      console.log("Returning this response:", statusCode, payloadString);
    });
  });
};

//Define a Router
const router = {
  ping: handlers.ping,
  hello: handlers.hello,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks
};
