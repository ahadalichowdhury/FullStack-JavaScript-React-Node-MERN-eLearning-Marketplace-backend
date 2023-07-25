let nodemailer = require("nodemailer");
require("dotenv").config();
const sendEmail = async (EmailTo, EmailText, EmailSubject) => {
  let transporter = nodemailer.createTransport({
    //from where to send email
    //this is for gmail, we can use yahoo mail or any smtp provider
    service: "gmail",
    host: "smtp.gmail.com",
    Port: 587,
    auth: {
      user: process.env.EMAIL, //my email address
      pass: process.env.EMAIL_PASSWORD, //my email address password
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // send mail with defined transport object
  let mailOptions = {
    from: '"lms eLearing platform" <cse_2012020156@lus.ac.bd>', //first part is the email headline and in <> we use our email address
    to: EmailTo, // list of receivers
    subject: EmailSubject, // Subject line
    html: EmailText, // plain text body
  };

  //send mail
  return await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
