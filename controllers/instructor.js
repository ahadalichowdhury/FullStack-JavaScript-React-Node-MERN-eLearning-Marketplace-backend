import userModel from "../models/userModel";
import queryString from "queryString";
const stripe = require("stripe")(process.env.STRIPE_SECRET);
import Courses from "../models/courseModel";

export const makeInstructor = async (req, res) => {
  try {
    // console.log("req.user.id: ", req.user.id);
    // 1. find the user from the database
    // console.log(req);
    const user = await userModel.findById(req.auth._id).exec();
    // 2. if user dont have stripe_account_id yet, then create new
    if (!user.stripe_account_id) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

    
      // console.log("ACCOUNT => ", account);
      user.stripe_account_id = account.id;
      user.save();
    }
    // 3. create account link based on account id (for frontend to complete onboarding)
    let accountLink = await stripe.accountLinks.create({
      account: user.stripe_account_id,
      refresh_url: process.env.STRIPE_REDIRECT_URL,
      return_url: process.env.STRIPE_REDIRECT_URL,
      type: "account_onboarding",
    });
    // console.log("accountLink: ", accountLink);
    // 4. pre-fill any info such as email (optional), then send url response to frontend
    accountLink = Object.assign(accountLink, {
      "stripe_user[email]": user.email,
    });
    // 5. then send the account link as response to frontend
    res.send(`${accountLink.url}?${queryString.stringify(accountLink)}`);
  } catch (err) {
    console.log("MAKE INSTRUCTOR ERROR: ", err);
  }
};

export const getAccountStatus = async (req, res) => {
  try {
    const user = await userModel.findById(req.auth._id).exec();
    const account = await stripe.accounts.retrieve(user.stripe_account_id);
    console.log("ACCOUNT STATUS", account);

    //account
    //we need to use ! in condition
    if (!account.charges_enabled) {
      return res.status(401).send("unauthorized");
    } else {
      //
      const updatedUser = await userModel
        .findByIdAndUpdate(
          user._id,
          {
            stripe_seller: account,
            $addToSet: { role: "Instructor" },
          },
          { new: true }
        )
        .select("-password")
        .exec();
      updatedUser.password = undefined;
      res.json(updatedUser);
    }
  } catch (error) {
    console.log("MAKE ERROR", error);
  }
};

export const currentInstructor = async (req, res) => {
  try {
    let user = await userModel
      .findById(req.auth._id)
      .select("-password")
      .exec();
    if (!user.role.includes("Instructor")) {
      return res.status(401).send("Unauthorized");
    } else {
      res.json({ ok: true });
    }
  } catch (err) {
    console.log(err);
  }
};

export const instructorCourses = async (req, res) => {
  try {
    const course = await Courses.find({ instructor: req.auth._id })
      .sort({ createAt: -1 })
      .exec();
    res.json(course);
  } catch (error) {
    console.log(error);
  }
};

export const studentCount = async (req, res) => {
  try {
    const users = await userModel.find({courses: req.body.courseId}).select("_id").exec()
    res.json(users)
  } catch (e) {
    console.log(e);
  }
}

  export const instructorBalance = async (req, res) => {
    try {
        const user = await userModel.findById(req.auth._id).exec();
        const balance = await stripe.balance.retrieve({
        stripeAccount: user.stripe_account_id,
        });
        res.json(balance);
    } catch (error) {
      console.log(error);
    }
}

export const payoutSettings = async (req, res) => {
  try{
    const user = await userModel.findById(req.auth._id).exec();
    const loginLink = await stripe.accounts.createLoginLink(
        user.stripe_seller.id, {
      redirect_url: process.env.STRIPE_SETTINGS_REDIRECT,
    });
    console.log("LOGIN LINK FOR PAYOUT SETTINGS", loginLink);
    res.json(loginLink.url);
  }catch (e) {
    console.log("Stripe payout settings login link error=>", e)
  }
}