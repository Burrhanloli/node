//Create and export config variables

//Container for the environments
const environments = {};

//Staging object (Default)
environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: "staging",
  hashingSecret: "thisIsASecret",
  maxChecks: 5,
  twilio: {
    accountSid: "ACb32d411ad7fe886aac54c665d25e5c5d",
    authToken: "9455e3eb3109edc12e3d8c92768f7a67",
    fromPhone: "+15005550006"
  }
};

//Production object
environments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: "production",
  hashingSecret: "thisIsAlsoSecret",
  maxChecks: 5,
  twilio: {
    accountSid: "ACb32d411ad7fe886aac54c665d25e5c5d",
    authToken: "9455e3eb3109edc12e3d8c92768f7a67",
    fromPhone: "+15005550006"
  }
};

//Determine which env should be exported through CMD
const currentEnvironment =
  typeof process.env.NODE_ENV == "string"
    ? process.env.NODE_ENV.toLowerCase()
    : "";

//Check the current env
const envvironmentToExport =
  typeof environments[currentEnvironment] == "object"
    ? environments[currentEnvironment]
    : environments.staging;
//export the module
module.exports = envvironmentToExport;
