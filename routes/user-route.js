const express = require("express");
const router = express.Router();
const userController = require("../controllers/user-controller");

router.get("/getAllMember", userController.getAllMember);
router.get("/getMember/:login_id", userController.getMember);
router.get("/getUsers", userController.getUsers);
router.get("/getAdmins", userController.getAdmins);
router.get("/verifyToken", userController.verifyToken);
router.get("/refreshToken", userController.refreshToken);
router.patch("/login", userController.login);
router.patch("/logout", userController.logout);
router.post("/signup", userController.signup);

module.exports = router;
