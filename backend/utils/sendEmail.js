const nodemailer = require('nodemailer');

/**
 * Send email via Gmail SMTP (App Password).
 * Works for sending to any email address without domain verification.
 */
const sendEmail = async ({ to, subject, text, html, replyTo }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // replyTo lets the recipient reply directly to the user's email,
  // not back to our SMTP account — critical for contact form emails
  const mailOptions = {
    from:    `"${process.env.FROM_NAME || 'Labour Connect'}" <${process.env.SMTP_USER}>`,
    to,
    subject,
    ...(replyTo && { replyTo }),
    ...(html && { html }),
    ...(text && !html && { text }),
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧  Email sent: ${info.messageId} → ${to}${replyTo ? ` (replyTo: ${replyTo})` : ''}`);
  return info;
};

module.exports = sendEmail;