let requestModule = require("request");
const enumVal = require("../enum/enum.js");

exports.fetchPeopleHrData = async (req) => {
  const { postPayloadOfPeopleHR } = enumVal;
  const { contentType, peopleAppsUrl, method } = postPayloadOfPeopleHR;
  return new Promise((resolve, reject) => {
    try {
      let headers = {
        "Content-Type": contentType,
      };
      let options = {
        method: method,
        url: peopleAppsUrl,
        headers: headers,
        json: true,
        body: req,
      };
      requestModule(options, function (error, response, body) {
        if (response.body.errorMessages) {
          response.body.message = response.body.errorMessages[0];
          response.body.errorIn = "peopleHR";
          response.body.statusCode = response.statusCode;
          reject(response.body);
        }
        resolve(response.body);
      });
    } catch (error) {
      reject(error);
    }
  });
};
