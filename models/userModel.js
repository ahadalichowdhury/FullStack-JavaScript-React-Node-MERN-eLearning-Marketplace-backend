import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 6,
      max: 64,
    },
    picture: {
      type: String,
      default: "/avatar.png",
    },
    role: {
      type: [String],
      default: ["Subscriber"],
      enum: ["Subscriber", "Instructor", "Admin"],
    },
    //this is for payment method stripe
    stripe_account_id: "",
    stripe_seller: {},
    stripeSession: {},

    //reset password
    // resetPasswordToken: String,
    // resetPasswordExpire: Date,
    passwordResetCode: {
      type: String,
    },
      courses: [
          {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Course"
          }
      ]
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// userSchema.methods.getResetPasswordToken = function () {
//   const resetToken = crypto.randomBytes(20).toString("hex");
//   this.resetPasswordToken = crypto
//     .createHash("sha256")
//     .update(resetToken)
//     .digest("hex");

//   this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

//   return resetToken;
// };
export default mongoose.model("User", userSchema);
