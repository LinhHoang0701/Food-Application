const nodemailer = require("nodemailer");
const keys = require("../config/keys");

const template = require("../config/template");

const { sender } = keys.mailgun;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "hoanglinhphal@gmail.com",
    pass: "Hoanglinh123",
  },
});

exports.sendEmail = async (email, type, host, data) => {
  try {
    const message = prepareTemplate(type, host, data);
    const config = {
      from: `Food App <${sender}>`,
      to: email,
      subject: message.subject,
      text: message.text,
    };
    return await transporter.sendMail(config);
  } catch (error) {
    console.log(error);
    return error;
  }
};

const prepareTemplate = (type, host, data) => {
  let message;

  switch (type) {
    case "reset":
      message = template.resetEmail(host, data);
      break;

    case "reset-confirmation":
      message = template.confirmResetPasswordEmail();
      break;

    case "signup":
      message = template.signupEmail(data);
      break;

    case "contact":
      message = template.contactEmail();
      break;

    default:
      message = "";
  }

  return message;
};
