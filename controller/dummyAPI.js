import nodemailer from 'nodemailer';
import dotenv from "dotenv";
dotenv.config();
export const dummyEmailService = async (req, res) => {

    // Send admin notification email
    const transporter = nodemailer.createTransport({
      host:'smtpout.secureserver.net',
      port:465,
      secure:true,
      auth: {
        user: process.env.PARTNER_EMAIL,
        pass: process.env.PARTNER_PASS,
      },
    });

    console.log(transporter)

    const mailOptions = {
      from: process.env.PARTNER_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: `🆕 New Job Request`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>📢 New Job Posting Request</h2>
          <p><strong>Recruiter:</strong></p>
          

          <h3>💼 Job Details</h3>
         

          <p style="margin-top: 20px;">📌 Please review and approve this request in the admin dashboard.</p>
          <p>Regards,<br><strong>Career Portal</strong></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: "Job request submitted successfully.",
    });

}