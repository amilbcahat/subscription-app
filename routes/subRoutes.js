const express = require("express");
// const resumeController = require("../controllers/reminderController");
const userController = require("./../controllers/userController");
const authController = require("../../subscription-app/controllers/authController");
const bookingController = require("../../subscription-app/controllers/bookingController");

const router = express.Router();

router.use(authController.protect);

router.route("/:type").post(userController.joinPlan);
router.get("/checkout-session/:type", bookingController.getCheckoutSession);
module.exports = router;
