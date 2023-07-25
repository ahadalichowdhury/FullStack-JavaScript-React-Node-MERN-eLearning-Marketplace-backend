import express from "express";

const router = express.Router();

//controller import
import {
  makeInstructor,
  getAccountStatus,
  currentInstructor,
  instructorCourses,
  studentCount,
  instructorBalance,
  payoutSettings
} from "./../controllers/instructor";
import { requireSignin } from "../middleware/middleware";

router.post("/make-instructor", requireSignin, makeInstructor);
router.post("/get-account-status", requireSignin, getAccountStatus);
router.get("/current-instuctor", requireSignin, currentInstructor);
router.get("/instructor-courses", requireSignin, instructorCourses);
router.post("/instructor/students-count", requireSignin, studentCount);
router.get("/instructor/balance", requireSignin, instructorBalance);
router.get("/instructor/payout-settings", requireSignin, payoutSettings);

module.exports = router;
