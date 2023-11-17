const express = require("express");
// const resumeController = require("../controllers/reminderController");
const userController = require("./../controllers/userController");
const authController = require("../../subscription-app/controllers/authController");

router.use(authController.protect);
