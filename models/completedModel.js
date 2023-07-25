import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

const completedModel = new mongoose.Schema(
    {
        user:{
            type: ObjectId,
            ref: "userModel"
        },
        course:{
            type: ObjectId,
            ref: "Course"
        },
        lessions:{}
    },{
        versionKey: false,
        timestamps: true,
    }

);

export default mongoose.model("Completed", completedModel);
