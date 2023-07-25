var { expressjwt: jwt } = require("express-jwt");
import userModel from "../models/userModel";
import Course from "../models/courseModel";

export const requireSignin = jwt({
  getToken: (req, res) => req.cookies.token,
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});

export const isInstructor = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.auth._id).exec();
    if (!user.role.includes("Instructor")) {
      return res.status(403).json({
        error: "Access denied",
      });
    }
    next();
  } catch (err) {
    return res.status(403).json({
      error: "Access denied",
    });
  }
};

export const isEnrolled = async (req, res, next) => {
    try {
        const user = await userModel.findById(req.auth._id).exec();
        const course = await Course.findOne({ slug: req.params.slug }).exec();
        //check if course id is found in user course array
        let ids = [];

        for (let i = 0; i < user.courses.length; i++) {
            ids.push(user.courses[i].toString());
        }
        if (!ids.includes(course._id.toString())) {
            return res.sendStatus(403);
        }else{
          next();
        }

    } catch (err) {
       console.log(err);
       return res.sendStatus(403);
    }
}
