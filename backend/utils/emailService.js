const nodemailer = require("nodemailer");

async function sendInvitationEmail(toEmail, invitationLink, teamName, senderName) {
  const safeTeamName = teamName || "Your Team";
  const safeSenderName = senderName || "A teammate";

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const currentYear = new Date().getFullYear();
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      font-family: 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      background: #f8f9fa;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
      padding: 30px 20px;
      text-align: center;
      color: white;
    }
    .header h2 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    }
    .content {
      padding: 30px;
      background-color: #333333;
      color: white;
    }
    .button {
      display: inline-block;
      padding: 12px 32px;
      background: white;
      color: black;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 500;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }
    .button:hover {
      background: #e2e6ea;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    .footer {
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6c757d;
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
    }
    .logo-text {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .invitation-note {
      background: #e9ecef;
      padding: 15px;
      border-radius: 6px;
      margin: 15px 0;
      font-size: 13px;
      color: black;
    }
  </style>
</head>
<body style="background-color: #f8f9fa; margin: 0; padding: 0;">
  <div class="email-container">
    <div class="header">
      <div class="logo-text">TodoHive</div>
      <h2>You're Invited to Join a Hive!</h2>
    </div>
    <div class="content">
      <h3>Hello there!</h3>
      <p>${safeSenderName} has invited you to collaborate on the team <strong>"${safeTeamName}"</strong> on <strong>TodoHive</strong> – your productivity command center.</p>
      <p>This workspace is built for seamless teamwork, efficient task tracking, and goal-smashing success.</p>
      <div style="text-align: center;">
        <a href="${invitationLink}" class="button">Accept Invitation</a>
      </div>
      <div class="invitation-note">
        <p style="margin: 0;">If the button above doesn’t work, copy and paste this link into your browser:</p>
        <p style="margin: 5px 0; word-break: break-all; font-family: monospace;">${invitationLink}</p>
        <p style="margin: 5px 0; color: #dc3545;">This invitation link will expire in 24 hours.</p>
      </div>
    </div>
    <div class="footer">
      <p>This email was sent from TodoHive on behalf of ${safeSenderName}.</p>
      <p>If you weren’t expecting this, you can safely ignore it.</p>
      <p>&copy; ${currentYear} TodoHive. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

  const mailOptions = {
    from: `"TodoHive" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `You're Invited to Join the "${safeTeamName}" Team on TodoHive`,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Invitation email sent to ${toEmail}: ${info.messageId}`);
  } catch (error) {
    console.error("Error sending invitation email:", error);
  }
}

module.exports = { sendInvitationEmail };
