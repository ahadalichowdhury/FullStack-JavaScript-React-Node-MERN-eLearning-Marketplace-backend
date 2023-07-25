import aws from "aws-sdk";
import shortid from "shortid";
import Course from "../models/courseModel";
import slugify from "slugify";
import { readFileSync } from "fs";
import userModel from "../models/userModel"; //fs.readFileSync
import CompletedModel from "../models/completedModel";
const stripe= require("stripe")(process.env.STRIPE_SECRET);

//configure aws s3
export const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  apiVersion: process.env.AWS_API_VERSION,
};

export const s3 = new aws.S3(awsConfig);

export const uploadImage = async (req, res) => {
  console.log("uploadImage", req.body);
  // console.log(req.body);
  try {
    const { image } = req.body;
    if (!image) return res.status(400).send("Image is required");

    // prepare the image to upload to S3
    const base64Data = new Buffer.from(
      image.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    const type = image.split(";")[0].split("/")[1];

    // image params
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `${shortid.generate()}.${type}`,
      Body: base64Data,
      ACL: "public-read",
      ContentEncoding: "base64",
      ContentType: `image/${type}`,
    };

    // upload image to S3
    s3.upload(params, async (err, data) => {
      if (err) {
        console.log(err);
        return res.status(400).send("Image upload failed. Try later.");
      }

      console.log(data);
      return res.status(200).send(data);
    });
  } catch (err) {
    console.log(err);
  }
};

export const removeImage = (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).send("No image found");

    const params = {
      Bucket: image.Bucket,
      Key: image.Key,
    };

    // 2. upload to s3
    s3.deleteObject(params, (err, data) => {
      if (err) {
        console.log("S3 delete err", err);
        res.sendStatus(400);
      }
      console.log("AWS DELETE RES DATA", data);
      res.send(data);
    });
  } catch (err) {}
};

export const create = async (req, res) => {
  // console.log("CREATE COURSE", req.body);
  // return;

  try {
    const alreadyExist = await Course.findOne({
      slug: slugify(req.body.name.toLowerCase()),
    });
    if (alreadyExist) {
      return res.status(400).send("Title is taken");
    }

    const course = await new Course({
      slug: slugify(req.body.name),
      instructor: req.auth._id,
      ...req.body,
    }).save();

    res.json(course);
  } catch (err) {
    console.log(err);
    return res.status(400).send("Course create failed. Try again.");
  }
};

export const readCourse = async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug })
      .populate("instructor", "_id name")
      .exec();
    res.json(course);
  } catch (error) {
    console.log(error);
  }
};

export const uploadVideo = async (req, res) => {
  try {
    // console.log("auth id",req.auth._id)
    // console.log("instructor id", req.params.instructorId)
    if (req.auth._id != req.params.instructorId) {
      return res.status(400).send("unauthorized");
    }

    const { video } = req.files;
    // console.log(video);
    if (!video) {
      return res.status(400).send("Video not found");
    }
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `${shortid.generate()}.${video.type.split("/")[1]}`, //video/mp4
      Body: readFileSync(video.path),
      ACL: "public-read",
      ContentType: video.type,
    };
    s3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
        res.sendStatus(400);
      }
      console.log(data);
      res.send(data);
    });
  } catch (e) {
    console.log(e);
  }
};

export const removeVideo = async (req, res) => {
  try {
    // console.log("auth id",req.auth._id)
    // console.log("instructor id", req.params.instructorId)
    if (req.auth._id != req.params.instructorId) {
      return res.status(400).send("unauthorized");
    }

    const { Bucket, Key } = req.body;
    // console.log(video);

    const params = {
      Bucket,
      Key,
    };
    s3.deleteObject(params, (err, data) => {
      if (err) {
        console.log(err);
        res.sendStatus(400);
      }
      console.log(data);
      res.send({ ok: true });
    });
  } catch (e) {
    console.log(e);
  }
};

export const addLesson = async (req, res) => {
  try {
    const { slug, instructorId } = req.params;
    const { title, content, video } = req.body;

    if (req.auth._id != instructorId) {
      return res.status(400).send("unauthorized");
    }
    const updated = await Course.findOneAndUpdate(
      { slug },
      {
        $push: { lessons: { title, content, video, slug: slugify(title) } },
      },
      {
        new: true,
      }
    )
      .populate("instructor", "_id name")
      .exec();
    res.json(updated);
  } catch (e) {
    console.log(e);
    return res.status(400).send("Add Lesson Failed");
  }
};

export const update = async (req, res) => {
  try {
    const { slug } = req.params;
    // console.log(slug)
    const course = await Course.findOne({ slug }).exec();

    // console.log(course);
    // console.log("auth id",req.auth._id)
    // console.log("instructor id", req.params.instructorId)

    if (req.auth._id != course.instructor) {
      return res.status(400).send("unauthorized");
    }

    const updateCourse = await Course.findOneAndUpdate({ slug }, req.body, {
      new: true,
    }).exec();
    res.json(updateCourse);
  } catch (e) {
    console.log(e);
  }
};

export const removeLesson = async (req, res) => {
  const { slug, lessonId } = req.params;
  // console.log(slug)
  const course = await Course.findOne({ slug }).exec();

  // console.log(course);
  // console.log("auth id",req.auth._id)
  // console.log("instructor id", req.params.instructorId)

  if (req.auth._id != course.instructor) {
    return res.status(400).send("unauthorized");
  }

  const courseDelete = await Course.findByIdAndUpdate(course._id, {
    $pull: { lessons: { _id: lessonId } },
  }).exec();

  res.json({ ok: true });
};

export const updateLesson =async (req, res) => {
  try{
    // console.log("CURRENT LESSON=====>", req.body);
    const {slug} = req.params;
    const {_id, title, content, video, free_preview} = req.body;
    const course = await Course.findOne({slug}).select("instructor").exec()
    // console.log(course.instructor)
    // console.log(req.auth._id)
    // return;
    if(course.instructor != req.auth._id){
      return res.status(400).send("unauthorized");
    }
    const updated = await Course.findOneAndUpdate(
        {"lessons._id": _id},{
            $set: {
                "lessons.$.title": title,
                "lessons.$.content": content,
                "lessons.$.video": video,
                "lessons.$.free_preview": free_preview,
            }
        },{
            new: true
        }
    ).exec();
    console.log(updated)
    res.json({ok: true});
    // console.log(updated)
  }catch (e) {
    console.log(e)
  }
}

export const publishCourse = async (req, res) => {
  try{
    const {courseId} = req.params;
    const course = await Course.findById(courseId).select("instructor").exec()
    if(course.instructor != req.auth._id){
      return res.status(400).send("unauthorized");
    }
    const updated = await Course.findByIdAndUpdate(courseId, {
        published: true
    },{
        new: true
    }).exec();
    res.json(updated)
  }catch (e) {
    console.log(e)
    return res.status(400).send("Publish course failed");
  }
}

export const unpublishCourse = async (req, res) => {
  try{
    const {courseId} = req.params;
    const course = await Course.findById(courseId).select("instructor").exec()
    if(course.instructor != req.auth._id){
      return res.status(400).send("unauthorized");
    }
    const updated = await Course.findByIdAndUpdate(courseId, {
      published: false
    },{
      new: true
    }).exec();
    res.json(updated)

  }catch (e) {
    console.log(e)
    return res.status(400).send("Publish course failed");
  }
}

export const allCourses  = async (req, res) => {
    try{
        const courses = await Course.find({published: true})
            .populate("instructor", "_id name")
            .exec();
        res.json(courses)
    }catch (e) {
        console.log(e)
    }
}

export const checkEnrollment = async (req, res) => {
  try{
    const {courseId} = req.params;
    const user = await userModel.findById(req.auth._id).exec();
    // check if course id is found in user courses array
    let ids = [];
    let length = user.courses && user.courses.length;
    for(let i = 0; i < length; i++){
      ids.push(user.courses[i].toString())
    }
    res.json({
      status: ids.includes(courseId),
      course: await Course.findById(courseId).exec()
    })
  }catch (e) {
    console.log(e)
  }
}

export const freeEnrollment = async (req, res) => {
  try{
    const course = await Course.findById(req.params.courseId).exec();
    if(course.paid){
      return ;
    }
    const result = await userModel.findByIdAndUpdate(req.auth._id, {
        $addToSet: {courses: course._id}
    }, {
      new: true
    }
    ).exec();
    res.json({
        message: "Free enrollment success",
        course: result
    })
  }catch (e) {
    console.log(e);
    return res.status(400).send("Free enrollment failed");
  }
}

export const paidEnrollment = async (req, res) => {
  try{
    //check if course is paid or free
    const course = await Course.findById(req.params.courseId).populate("instructor").exec();

    if (!course.paid) {
      return;
    }

// Calculate application fee as 30% of course price
    const fee = Math.round((course.price * 0.3) * 100);

// Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(course.price * 100),
            product_data: {
              name: course.name,
              description: course.description,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      payment_intent_data: {
        application_fee_amount: fee,
        transfer_data: {
          destination: course.instructor.stripe_account_id,
        },
      },
      success_url: `${process.env.STRIPE_SUCCESS_URL}/${course._id}`,
      cancel_url: process.env.STRIPE_CANCEL_URL,
    });

// Save the Stripe Checkout session ID to the user model
    await userModel.findByIdAndUpdate(req.auth._id, {
      stripeSession: session,
    }).exec();

// Send the session ID as the response to the client
    res.send({ sessionId: session.id });
  }catch (e) {
    console.log(e);
    return res.status(400).send("Paid enrollment failed");
  }
}

export const stripeSuccess = async (req, res) => {
  try{
    //find course
    const course = await Course.findById(req.params.courseId).exec();
    //find user
    const user = await userModel.findById(req.auth._id).exec();

    //if no stripe session return
    console.log("BackEND USER", user.stripeSession.id);


    if (!user.stripeSession || !user.stripeSession.id) {
      return res.status(400).json({ error: 'No Stripe session found for user' });
    }
    //returning stripe session
    const session = await stripe.checkout.sessions.retrieve(user.stripeSession.id);

    if (session.payment_status === 'paid') {
      await userModel.findByIdAndUpdate(user._id, {
        $addToSet: { courses: course._id },
        $set: { stripeSession: {} },
      }).exec();
      return res.json({ success: true, course });
    } else {
      return res.status(400).json({ error: 'Stripe session payment status is not "paid"' });
    }
  }catch (e) {
    console.log("STRIPE SUCCESS ERR", e)
    res.json({success: false})
  }
}

export const userCourses = async (req, res) => {
  try{
    const user = await userModel.findById(req.auth._id).exec();
    const courses = await Course.find({_id: {$in: user.courses}}).populate("instructor", "_id name").exec()
    res.json(courses)
  }catch (e) {
    console.log(e)
  }
}

export const markCompleted = async (req, res) => {
  const {courseId, lessonId} = req.body;
  // console.log("COURSE ID", courseId, "LESSON ID", lessonId);
  //find if user with that course is already created
  const existing = await CompletedModel.findOne({
    user: req.auth._id,
    course: courseId
    }).exec();
    if(existing){
      //update
        const updated = await CompletedModel.findOneAndUpdate({
            user: req.auth._id,
            course: courseId
        },{
          $addToSet: {lessons: lessonId}
        }).exec();
        // console.log("COMPLETED COURSE UPDATE", updated);
        res.json({ok: true})
    }else{
      //create
        const completed =await new CompletedModel({
            user: req.auth._id,
            course: courseId,
            lessons: [lessonId]
        }).save();
        // console.log("COMPLETED COURSE CREATE", completed);
        res.json({ok: true})
    }
}

export const listCompleted = async (req, res) => {
  try{
    const list = await CompletedModel.find({user: req.auth._id, course: req.body.courseId}).exec();
     list && res.json(list[0].lessons);
  }catch (e) {
    console.log(e);
  }
}

export const markInCompleted = async (req, res) => {
  try{
    const {courseId, lessonId} = req.body;
    const updated = await CompletedModel.findOneAndUpdate({
      user: req.auth._id,
      course: courseId,
    },{
      $pull: {lessons: lessonId}
    }).exec();
    res.json({ok: true})
  }catch (e) {
    console.log(e);
  }
}