// server/utils/sendEmail.js
const nodemailer = require('nodemailer');

// Temporary debug logs – remove these after verification
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("SMTP_PASS:", process.env.SMTP_PASS);

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: 'sugisubramanii@gmail.com',
    pass: 'rptfsvloqjvabplr'
  }
});



module.exports = async function sendEmail({ to, subject, html }) {
  try {
    return await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
