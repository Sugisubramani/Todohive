const nodemailer = require("nodemailer");

async function sendInvitationEmail(toEmail, invitationLink, teamName) {

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,       
    port: process.env.SMTP_PORT,        
    secure: process.env.SMTP_SECURE === "true", 
    auth: {
      user: process.env.SMTP_USER,      
      pass: process.env.SMTP_PASS,       
    },
  });

  const mailOptions = {
    from: `"Your App Name" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `Invitation to join team "${teamName}"`,
    html: `
      <p>You have been invited to join the team <strong>${teamName}</strong>.</p>
      <p>Please click <a href="${invitationLink}">here</a> to accept your invitation.</p>
      <p>After accepting, you will be redirected to your personal dashboard where you can access the team from the sidebar.</p>
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
