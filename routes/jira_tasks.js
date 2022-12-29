const express = require("express");
const router = express.Router();
const controller = require("../controllers/jira_controller");
const peopleAppsScheduler = require("../peopleHrApi.js");
const enumUrl = require("../enum/enum");
const coneJob = require("../ersUpdateApi.js");

router.post("/fetchJiraTasks", async function (req, res) {
  controller.fetchJiraProjectRecords(req, res)
});

router.post(enumUrl.API_URL.JIRA_PROJECT, async function (req, res) {
  let result = await initiateJiraScheduler()
  res.send({ "status": "200", data: result })
});

router.post(enumUrl.API_URL.CREATE_USER, async (req, res) => {
  let result = await peopleAppsScheduler.peopleHrErsScheduler();
  res.send(result);
});

const initiateJiraScheduler = async () => {
  await coneJob.fetchJiraProjectRecords();
};

module.exports = router;
