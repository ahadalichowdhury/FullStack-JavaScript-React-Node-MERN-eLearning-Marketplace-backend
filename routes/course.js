import express from "express";
//this is use for file into binary data
import formidable from "express-formidable";

const router = express.Router();

//controller import
import {
  uploadImage,
  removeImage,
  create,
  readCourse,
  uploadVideo,
  removeVideo,
  addLesson,
  update,
  removeLesson,
  updateLesson,
  publishCourse,
  unpublishCourse,
  allCourses,
  checkEnrollment,
  freeEnrollment,
  paidEnrollment,
  stripeSuccess,
  userCourses,
  markCompleted,
  listCompleted,
  markInCompleted
} from "./../controllers/courseController";
import {requireSignin, isInstructor, isEnrolled} from "../middleware/middleware";


router.get("/courses", allCourses)
router.post("/course/upload-image", uploadImage);
router.post("/course/remove-image", removeImage);

router.post("/course", requireSignin, isInstructor, create);
router.put("/course/:slug", requireSignin, update);
router.get("/course/:slug", readCourse);
router.post(
  "/course/video-upload/:instructorId",
  requireSignin,
  formidable(),
  uploadVideo
);


router.post("/course/remove-video/:instructorId", requireSignin, removeVideo);
router.put("/course/lesson/:slug/:instructorId", requireSignin, updateLesson);
router.put("/course/publish/:courseId", requireSignin, publishCourse);
router.put("/course/unpublish/:courseId", requireSignin, unpublishCourse);
router.post("/course/lesson/:slug/:instructorId", requireSignin, addLesson);


router.put("/course/:slug/:lessonId", requireSignin, removeLesson);
router.get("/check-enrollment/:courseId", requireSignin, checkEnrollment);
router.post("/free-enrollment/:courseId", requireSignin, freeEnrollment);
router.post("/paid-enrollment/:courseId", requireSignin, paidEnrollment);
router.get("/stripe-success/:courseId", requireSignin, stripeSuccess);
router.get("/user-courses", requireSignin, userCourses);

router.get("/user/course/:slug",requireSignin, isEnrolled,  readCourse);


//mark completed
router.post("/mark-completed", requireSignin, markCompleted);
router.post("/list-completed", requireSignin, listCompleted);
router.post("/mark-incompleted", requireSignin, markInCompleted);

module.exports = router;
