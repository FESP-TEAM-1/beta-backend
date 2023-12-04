const express = require("express");
const router = express.Router();
const userController = require("../controllers/user-controller");

router.get("/getAllUser", userController.getAllUser);
router.get("/getUser", userController.getUser);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.post("/signup", userController.signup);

module.exports = router;
