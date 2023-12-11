const express = require("express");
const router = express.Router();
const userController = require("../controllers/user-controller");

router.get("/getAllMember", userController.getAllMember);
router.get("/getMember/:user_id", userController.getMember);
router.get("/getUser", userController.getUser);
router.get("/getAdmin", userController.getAdmin);
router.patch("/login", userController.login);
router.patch("/logout", userController.logout);
router.post("/signup", userController.signup);

module.exports = router;
