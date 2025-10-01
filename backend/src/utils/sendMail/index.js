import dotenv from "dotenv";
import ejs from "ejs";
import nodemailer from "nodemailer";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to render EJS template
const renderEmailTemplate = async (templateName, data) => {
  const templatePath = path.join(
    __dirname,
    "..",
    "email-templates",
    `${templateName}.ejs`
  );
  return ejs.renderFile(templatePath, data);
};

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Render EJS template to HTML
  const html = await renderEmailTemplate(options.templateName, options.data);

  const mailOptions = {
    from: `"Newsx" <${process.env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

export { sendEmail };
