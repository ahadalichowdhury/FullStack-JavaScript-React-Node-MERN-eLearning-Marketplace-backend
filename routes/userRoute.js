import express from "express";

const router = express.Router();

//controller import
import {
  login,
  register,
  logout,
  currentUser,
  forgotPassword,
  resetPassword,
} from "./../controllers/userController";
import { requireSignin } from "../middleware/middleware";
//router
router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);

//current user with current login middleware
router.get("/current-user", requireSignin, currentUser);


router.post("/forgot-password", forgotPassword);
router.post("/resetpassword", resetPassword);

module.exports = router;
