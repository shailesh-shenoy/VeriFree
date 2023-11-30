import { IssuerEmail } from "@/components/IssuerEmail";
import { IssueDetails, IssueRequest } from "@/types";
import { render } from "@react-email/components";
import nodemailer from "nodemailer";

const smtpSettings = {
  service: "gmail",

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
};
const expirationTimeInMinutes =
  Number(process.env.ISSUER_CLAIM_EXPIRY_MIN) || 60;

export const handleEmailFire = async (issueDetails: IssueDetails) => {
  const transporter = nodemailer.createTransport({
    ...smtpSettings,
  });

  return await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: issueDetails.studentEmail,
    subject: "Claim your Student Verified Credential",
    html: render(IssuerEmail(issueDetails)),
  });
};
