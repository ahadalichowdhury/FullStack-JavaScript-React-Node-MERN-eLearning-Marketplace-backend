import userModel from "../models/userModel";
import { hashPassword, comparePassword } from "../utils/userBrypt";
import sendEmail from "../utils/sendEmail";
import jwt from "jsonwebtoken";
const shortid = require("shortid");

// const awsConfig = {
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
//   apiVersion: process.env.AWS_API_VERSION,
// };

// const SES = new AWS.SES(awsConfig);

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }
    const user = await userModel.findOne({ email }).exec();
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = userModel.create({
      name,
      email,
      password: hashedPassword,
    });
    res.status(200).json({ status: "success", data: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    // console.log(req.body);
    const { email, password } = req.body;
    // check if our db has user with that email
    const user = await userModel.findOne({ email }).exec();
    if (!user) return res.status(400).send("No user found");
    // check password
    const match = await comparePassword(password, user.password);
    if (!match) return res.status(400).send("Password is incorrect");
    // create signed jwt
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    // return user and token to client, exclude hashed password
    user.password = undefined;
    // send token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      // secure: true, // only works on https
    });
    // send user as json response
    res.json(user);
  } catch (err) {
    console.log(err);
    return res.status(400).send("Error. Try again.");
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({ status: "success" });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err.message);
  }
};

//current user

export const currentUser = async (req, res) => {
  // console.log(req.auth._id);
  try {
    const user = await userModel
      .findById(req.auth._id)
      .select("-password")
      .exec();

    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error });
  }
};

// export const sendEmail = (req, res) => {
//   const params = {
//     Source: process.env.EMAIL_FROM,
//     Destination: {
//       ToAddresses: ["smahadalichowdhury@gmail.com"],
//     },
//     ReplyToAddresses: [process.env.EMAIL_FROM],
//     Message: {
//       Body: {
//         Html: {
//           Charset: "UTF-8",
//           Data: `
//           <html>
//           <h1>Reset Password link</h1>
//           <p>Please use the following link to reset your password</p>
//           </html>
//           `,
//         },
//       },
//       Subject: {
//         Charset: "UTF-8",
//         Data: "Reset Password link",
//       },
//     },
//   };

//   const emailSent = SES.sendEmail(params).promise();

//   emailSent
//     .then((data) => {
//       console.log(data);
//       res.json({ ok: true });
//     })
//     .catch((err) => {
//       console.log(err);
//     });
// };

//recovery password email
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const shortcode = shortid.generate();
    const user = await userModel.findOneAndUpdate(
      { email: email },
      {
        passwordResetCode: shortcode,
      }
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "no user found",
      });
    }

    //prepare for email

    // const resetURL = process.env.RESET_URL;

    // const resetUrl = `${resetURL}/${shortcode}`;
    const message = `
      <h1>You have requested a password reset</h1>
      <p>use this code to reset your password</p>
      <p style="color:red; font-size:28px">${shortcode}</p>

    `;

    try {
      sendEmail(user.email, message, "password reset request");
      return res.status(200).json({
        success: true,
        data: "email send",
      });
    } catch (err) {
      // user.resetPasswordToken = undefined;
      // user.resetPasswordExpire = undefined;

      await user.save();

      return res.status(500).json({
        success: false,
        error: "email could not be send",
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const hashedPassword = await hashPassword(newPassword);

    const user = await userModel
      .findOneAndUpdate(
        {
          email,
          passwordResetCode: code,
        },
        {
          password: hashedPassword,
          passwordResetCode: "",
        }
      )
      .exec();

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
