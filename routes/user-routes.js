const express = require("express");
const {
  signup,
  login,
  verify,
  getUser,
  refreshToken,
  logout,
} = require("../controllers/user-controller");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/user", verify, getUser);
router.get("/refresh", refreshToken, verify, getUser);
router.post("/logout", verify, logout);

module.exports = router;
