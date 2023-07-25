import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

const lessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 255,
      required: true,
    },
    slug: {
      type: String,
      lowercase: true,
    },
    content: {
      type: {},
      minlength:10,
    },
    video: {},
    free_preview: {
      type: Boolean,
      default: false,
    },


  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    minilength: 3,
    maxlength: 255,
    required: true,
  },
  slug: {
    type: String,
    lowercase: true,
  },
  description: {
    type: {},
    minlength: 20,
  },
  price: {
    type: Number,
    default: 9.99,
  },
  image: {
    type: {},
  },
  category: {
    type: String,
  },
  published: {
    type: Boolean,
    default: false,
  },
  paid: {
    type: Boolean,
    default: true,
  },
  instructor: {
    type: ObjectId,
    ref: "User",
    required: true,
  },
  lessons: [lessionSchema],

});

export default mongoose.model("Course", courseSchema);
