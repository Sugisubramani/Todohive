const nodemailer = require("nodemailer");

async function sendInvitationEmail(toEmail, invitationLink, teamName) {
  // Create a transporter using your SMTP settings.
  // These should be set in your .env file.
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,         // e.g., smtp.gmail.com
    port: process.env.SMTP_PORT,         // e.g., 587
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for others
    auth: {
      user: process.env.SMTP_USER,       // your SMTP username/email
      pass: process.env.SMTP_PASS,       // your SMTP password
    },
  });

  const mailOptions = {
    from: `"Your App Name" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `Invitation to join team "${teamName}"`,
    html: `
      <p>You have been invited to join the team <strong>${teamName}</strong>.</p>
      <p>Please click <a href="${invitationLink}">here</a> to accept your invitation.</p>
      <p>If you did not expect this email, please ignore it.</p>
    `,
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log(`Invitation email sent to ${toEmail}: ${info.messageId}`);
  } catch (error) {
    console.error("Error sending invitation email:", error);
  }
}

module.exports = { sendInvitationEmail };
