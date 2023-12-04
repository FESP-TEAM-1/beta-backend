const express = require("express");
const router = express.Router();
const userController = require("../controllers/user-controller");

router.get("/getAllUser", userController.getAllUser);
router.post("/getUser", userController.getUser);
router.patch("/login", userController.login);
router.patch("/logout", userController.logout);
router.post("/signup", userController.signup);

module.exports = router;
