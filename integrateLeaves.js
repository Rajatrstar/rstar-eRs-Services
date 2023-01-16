const config = require("./enum/enum.js");
const services = require("./services/peopleServices.js");
const enumVal = require("./enum/enum");
const request = require("request");

const makeReqForFetchingPeopleHrLeavesData = () => {
  const { postPayloadOfPeopleHR, postPayloadOfPeopleHrLeavesData } = config;
  const { apiKey, action } = postPayloadOfPeopleHR;
  const { queryName } = postPayloadOfPeopleHrLeavesData;
  return {
    APIKey: apiKey,
    Action: action,
    QueryName: queryName,
  };
};

const makeOptionsForFindingResourceId = (resourceEmail) => {
  let { postPayloadOfFindingResourceId } = config;
  let { url, method, contentType, authorization } =
    postPayloadOfFindingResourceId;
  let headers = {
    "Content-Type": contentType,
    Authorization: authorization,
  };
  let body = {
    email: resourceEmail,
  };
  return {
    url,
    method,
    headers,
    body,
    json: true,
  };
};

const makeOptionsForFindResurcesData = () => {
  let { postPayloadOfFindingResourceId, postPayloadOfFindingResourcesData } =
    config;
  let { method, contentType, authorization } = postPayloadOfFindingResourceId;
  let { url } = postPayloadOfFindingResourcesData;
  let headers = {
    "Content-Type": contentType,
    Authorization: authorization,
  };
  return {
    url: url.replace("?total_limit", 500),
    method,
    headers,
    json: true,
  };
};

const makeOptionsForIntegratingLeaveWithERS = (
  resourceId,
  resourceLeaveInfo
) => {
  let { postPayloadOfFindingResourceId, postPayloadOfintegratingLeaveWithERS } =
    config;
  let { method, contentType, authorization } = postPayloadOfFindingResourceId;
  let { url } = postPayloadOfintegratingLeaveWithERS;
  let headers = {
    "Content-Type": contentType,
    Authorization: authorization,
  };
  return {
    // url: url.replace("?resource_id", resourceId),
    url: url.replace("?resource_id", "xyz"),
    method,
    headers,
    body: resourceLeaveInfo,
    json: true,
  };
};

const isApplyLeaveInErs = () => {
  return 0;
};

function integrateLeaves() {
  integrateLeaves.prototype.fetchAndIntegrateLeavesData = async () => {
    let peopleHrLeavesData = await this.fetchPepleHrLeavesData();
    if (peopleHrLeavesData.length > 0) {
      this.integratePepleHrLeaveDataWithErs(peopleHrLeavesData);
    }
  };

  integrateLeaves.prototype.integratePepleHrLeaveDataWithErs = async (
    peopleHrLeavesData
  ) => {
    /**
     * Resource->Employee
     */
    for (let i = 0; i < 1; i++) {
      let resourceEmail;
      let resourceId;
      resourceEmail = peopleHrLeavesData[i]["Work Email"];
      /**
       * To check apply leave is in ers or not
       * if not then find the resource id and integrate it into the ERS
       */
      if (!isApplyLeaveInErs()) {
        //Find the resource id
        if (resourceEmail) {
          resourceId = await this.findResourceId(resourceEmail);
          /**
           * for some resources. resource id is not available at rStar id
           * so we need to find it from the sofbang id
           */
          if (!resourceId) {
            (resourceEmail = `${peopleHrLeavesData[i][
              "First Name"
            ].toLowerCase()}.${peopleHrLeavesData[i][
              "Last Name"
            ].toLowerCase()}${enumVal.CONSTANT_VALUES.sofbangEmail}`),
              (resourceId = await this.findResourceId(resourceEmail));
            /**
             * if the email id of  a resource is  wrong in system(People hr).
             * In that case, we need to find all resource id.
             * and the resource whose resource id is wrong has to be filtered out of them by employee id and with this ,our  time complexity also be fine
             */
            if (!resourceId) {
              //find all resource Data
              resourceData = await this.findResourcesData();
              resourceId = resourceData.find(
                (elem) =>
                  elem.udf_emp_id == peopleHrLeavesData[i]["Employee Id"]
              ).id;
            }
          }
          //Integrate People hr leave with ERS
          let resourceLeaveInfo = {
            date: "2023-01-27",
            description: peopleHrLeavesData[i]["Other Events Reason"]
              ? peopleHrLeavesData[i]["Other Events Reason"].substring(0, 98)
              : peopleHrLeavesData[i]["Leaver Comments"]
              ? peopleHrLeavesData[i]["Leaver Comments"].substring(0, 98)
              : "CL/SL",
            name: peopleHrLeavesData[i]["Other Events Reason"]
              ? peopleHrLeavesData[i]["Other Events Reason"].substring(0, 49)
              : peopleHrLeavesData[i]["Leaver Comments"]
              ? peopleHrLeavesData[i]["Leaver Comments"].substring(0, 49)
              : "CL/SL",
            is_working_exception: false,
          };
          await this.integrateLeaveWithERS(resourceId, resourceLeaveInfo);
        }
      }
    }
  };

  integrateLeaves.prototype.fetchPepleHrLeavesData = async () => {
    let req = makeReqForFetchingPeopleHrLeavesData();
    try {
      const response = await services.fetchPeopleHrData(req);
      return response.Result;
    } catch (err) {
      throw err;
    }
  };

  integrateLeaves.prototype.findResourceId = async (resourceEmail) => {
    let options = makeOptionsForFindingResourceId(resourceEmail);
    return new Promise((resolve, reject) => {
      try {
        request(options, async (error, response, body) => {
          if (error) {
            reject(error);
          } else if (response.statusCode === 200) {
            if (body.data.length === 0) {
              //If we will pass the wrong Email Address in the options. In that case, we will enter this condition
              resolve(0);
            } else {
              resolve(body.data[0].id);
            }
          }
        });
      } catch (error) {
        throw error;
      }
    });
  };

  integrateLeaves.prototype.findResourcesData = async () => {
    let options = makeOptionsForFindResurcesData();
    return new Promise((resolve, reject) => {
      try {
        request(options, async (error, response, body) => {
          if (error) {
            reject(error);
          } else if (response.statusCode === 200) {
            resolve(body.data);
          }
        });
      } catch (err) {
        throw err;
      }
    });
  };

  integrateLeaves.prototype.integrateLeaveWithERS = async (
    resourceId,
    resourceLeaveInfo
  ) => {
    let options = makeOptionsForIntegratingLeaveWithERS(
      resourceId,
      resourceLeaveInfo
    );
    return new Promise((resolve, reject) => {
      try {
        request(options, async (error, response, body) => {
          if (error) {
            reject(error);
          } else if (response.statusCode === "xyz") {
            resolve(body.data);
          } else {
            console.log(response.statusCode);
          }
        });
      } catch (err) {
        throw err;
      }
    });
  };
}

let selfInvoke = new integrateLeaves();
selfInvoke.fetchAndIntegrateLeavesData();
