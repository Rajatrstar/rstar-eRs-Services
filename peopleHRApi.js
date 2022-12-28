const config = require("./enum/enum.js");
const services = require("./services/peopleServices.js");
const request = require("request");
const enumVal = require('./enum/enum')

const makeReqForFetchingPeopleHrEmpsData = () => {
  const { postPayloadOfPeopleHR } = config;
  const { apiKey, action, queryName } = postPayloadOfPeopleHR;
  return {
    APIKey: apiKey,
    Action: action,
    QueryName: queryName,
  };
};

const makeOptionsForFetchingErsEmpsData = (offset = 0, totalLimit = 500) => {
  const { postPayloadOfErsRecords } = config;
  const { ersUrl, contentType, Authorization, method } =
    postPayloadOfErsRecords;

  //Replace offset and total Limit value
  let url = ersUrl.replace("?offset_val", offset);
  url = url.replace("?total_limit", totalLimit);

  let headers = {
    "Content-Type": contentType,
    Authorization,
  };
  return {
    url,
    headers,
    method,
    json: true,
  };
};

const makeOptionsForCreatingEmpInErs = (empDetails) => {
  const { postPayloadOfERS } = config;
  const { ersUrl, contentType, Authorization, method } = postPayloadOfERS;
  let headers = {
    "Content-Type": contentType,
    Authorization,
  };

  let empDate = empDetails["Start Date"].replaceAll("/", "-");

  let body = {
    first_name: empDetails["First Name"],
    last_name: empDetails["Last Name"],
    start_date: empDate,
    email: `${empDetails["First Name"].toLowerCase()}.${empDetails["Last Name"].toLowerCase()}${enumVal.CONSTANT_VALUES.EMAIL}`,
    resource_type_id: 1,
    udf_emp_id:empDetails["Employee Id"]
  };

  return {
    url: ersUrl,
    headers,
    method,
    body,
    json: true,
  };
};

const isEmpInErsOrNot = (empId, ersEmpsData) => {
  let emp = ersEmpsData.find((empDtl) => empDtl.udf_emp_id === empId);
  return emp ? true : false;
};

function peopleApps() {
  peopleApps.prototype.peopleHrErsScheduler = async () => {
    let peopleHREmpsData = await this.fetchPeopleHrEmpsData();
    let ersEmpsData = await this.fetchErsEmpsData();
    if (peopleHREmpsData.length > 0) {
      this.loadPeopleHrDataInErs(peopleHREmpsData, ersEmpsData);
    }
  };

  peopleApps.prototype.loadPeopleHrDataInErs = async (
    peopleHREmpsData,
    ersEmpsData
  ) => {
    for (let i = 0; i < peopleHREmpsData.length; i++) {
      let empId = peopleHREmpsData[i]["Employee Id"];
      //Check Employee of above empId (People hr emp id) is present in ers or not
      if (!isEmpInErsOrNot(empId, ersEmpsData)) {
        //Create Emp in Ers
        await this.createEmpInErs(peopleHREmpsData[i]);
      }
    }
  };

  peopleApps.prototype.fetchPeopleHrEmpsData = async () => {
    const req = makeReqForFetchingPeopleHrEmpsData();
    try {
      const response = await services.fetchPeopleHrData(req);
      return response.Result;
    } catch (err) {
      throw err;
    }
  };

  peopleApps.prototype.fetchErsEmpsData = async () => {
    const options = makeOptionsForFetchingErsEmpsData(0, 500);
    return new Promise((resolve, reject) => {
      try {
        request(options, async (error, response, body) => {
          if (error) {
            reject(error);
          } else {
            if (response.statusCode === 200) {
              resolve(response.body.data);
            }
          }
        });
      } catch (error) {
        throw error;
      }
    });
  };

  peopleApps.prototype.createEmpInErs = async (empDetails) => {
    const options = makeOptionsForCreatingEmpInErs(empDetails);
    try {
      return new Promise((resolve, reject) => {
        request(options, (error, response, Body) => {
          if (error) {
            reject(error);
          } else {
            if (response.statusCode === 201) {
              resolve(true);
            }
          }
        });
      });
    } catch (error) {
      throw err;
    }
  };
}

module.exports = new peopleApps();
