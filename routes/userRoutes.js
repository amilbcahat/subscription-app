const express = require("express");
// const resumeController = require("../controllers/reminderController");
const userController = require("./../controllers/userController");
const authController = require("../../subscription-app/controllers/authController");
const router = express.Router();

router.route("/signup").post(authController.signup);
router.route("/login").post(authController.login);
router.use(authController.protect);
router.route("/me").get(userController.getCurrentUser);

module.exports = router;
