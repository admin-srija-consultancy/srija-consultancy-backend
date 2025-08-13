import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const contactFormHandler = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required." });
    }
    // console.log(name,email)
    // Mail transporter (GoDaddy SMTP)
    const transporter = nodemailer.createTransport({
      host: "smtpout.secureserver.net",
      port: 465,
      secure: true,
      auth: {
        user: process.env.ADMIN_EMAIL, // admin email
        pass: process.env.ADMIN_PASS,
      },
    });

    // 1️⃣ Send message to Admin
    const adminMailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: process.env.ADMIN_EMAIL, // Admin receives the contact form
      subject: `📩 Contact Form Submission - ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>📬 New Contact Form Message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p style="background:#f8f8f8; padding:10px; border-radius:5px;">
            ${message}
          </p>
        </div>
      `,
    };

    await transporter.sendMail(adminMailOptions);

    // 2️⃣ Send acknowledgment to the sender
    const userMailOptions = {
      from: process.env.ADMIN_EMAIL, // Admin sending the mail
      to: email, // Sender's email
      subject: `✅ We received your message: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Hi ${name},</h2>
          <p>Thank you for reaching out to us. We have received your message and will get back to you as soon as possible.</p>
          <h3>Your Message:</h3>
          <p style="background:#f8f8f8; padding:10px; border-radius:5px;">
            ${message}
          </p>
          <p>Best regards,<br><strong>Career Portal</strong></p>
        </div>
      `,
    };

    await transporter.sendMail(userMailOptions);

    return res.status(200).json({ message: "Contact form submitted and acknowledgment sent." });

  } catch (error) {
    console.error("Email sending failed:", error);
    return res.status(500).json({ error: "Failed to send contact form." });
  }
};
