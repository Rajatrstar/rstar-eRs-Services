const express = require("express");
const router = express.Router();
const controller = require("../controllers/jira_controller");
const peopleAppsScheduler = require("../peopleHrApi.js");
const enumUrl = require("../enum/enum");
const coneJob = require("../ersUpdateApi.js");

router.post("/fetchJiraTasks", async function (req, res) {
  controller.fetchJiraProjectRecords(req, res);
});
//creating Jira task & project in Ers
router.post(enumUrl.API_URL.JIRA_PROJECT, async function (req, res) {
  let result = await initiateJiraScheduler();
  res.send({ "status": "200", data: result });
});
//creating Employee From PeopleHr to Ers
router.post(enumUrl.API_URL.CREATE_USER, async (req, res) => {
  let result = await initiatePeopleHrScheduler();
  res.send({ "status": "200", data: result });
});

//creating Jira task & project in Ers
const initiateJiraScheduler = async () => {
  await coneJob.fetchJiraProjectRecords();
};
//creating Employee From PeopleHr to Ers
const initiatePeopleHrScheduler = async () => {
  await peopleAppsScheduler.peopleHrErsScheduler();
};

module.exports = router;
