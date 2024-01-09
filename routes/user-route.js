const express = require("express");
const router = express.Router();
const userController = require("../controllers/user-controller");
const { userAuthenticate, supervisorAuthenticate } = require("../middleware/auth-middleware");

router.get("/getAllMember", supervisorAuthenticate, userController.getAllMember);
router.get("/getMember", userAuthenticate, userController.getMember);
router.get("/sign/getMember/:login_id", userController.getConfirmId);
router.get("/getUsers", supervisorAuthenticate, userController.getUsers);
router.get("/getAdmins", supervisorAuthenticate, userController.getAdmins);
router.get("/verifyToken", userController.verifyToken);
router.get("/refreshToken", userController.refreshToken);
router.post("/signup", userController.signup);
router.patch("/login", userController.login);
router.patch("/logout", userController.logout);
router.put("/updateMember", userAuthenticate, userController.updateMember);

module.exports = router;
