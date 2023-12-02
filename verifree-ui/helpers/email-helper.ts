import { IssuerEmail } from "@/components/IssuerEmail";
import { IssueDetails, IssueRequest } from "@/types";
import { render } from "@react-email/components";
import axios from "axios";
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

export async function validEmailDomain(email: string): Promise<boolean> {


  const allowedDomainsInDB: string[] = await getValidDomains()
  if (!allowedDomainsInDB || allowedDomainsInDB.length === 0) {
    throw new Error("No allowed domains found.")
  }
  for (const domain of allowedDomainsInDB) {
    if (email.endsWith(domain)) {
      return true
    }
  }
  return false
}

export async function emailAlreadyVerified(email: string): Promise<boolean> {
  const DB_API_URL = process.env.DB_API_URL
  const DB_API_KEY = process.env.DB_API_KEY
  const DB_DATA_SOURCE = process.env.DB_DATA_SOURCE
  const DB_DATABASE = process.env.DB_DATABASE
  const DB_VERIFIED_EMAILS_COLLECTION = process.env.DB_VERIFIED_EMAILS_COLLECTION
  const response = await axios.post(`${DB_API_URL}/action/find`, {
    dataSource: DB_DATA_SOURCE,
    database: DB_DATABASE,
    collection: DB_VERIFIED_EMAILS_COLLECTION,
    filter: {
      email: email
    }
  },
    {
      headers: {
        "api-key": DB_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    }
  )
  return response.data?.documents?.length > 0
}

export async function addVerifiedEmail(email: string): Promise<void> {
  const DB_API_URL = process.env.DB_API_URL
  const DB_API_KEY = process.env.DB_API_KEY
  const DB_DATA_SOURCE = process.env.DB_DATA_SOURCE
  const DB_DATABASE = process.env.DB_DATABASE
  const DB_VERIFIED_EMAILS_COLLECTION = process.env.DB_VERIFIED_EMAILS_COLLECTION
  const response = await axios.post(`${DB_API_URL}/action/insertOne`, {
    dataSource: DB_DATA_SOURCE,
    database: DB_DATABASE,
    collection: DB_VERIFIED_EMAILS_COLLECTION,
    document: {
      email: email
    }
  },
    {
      headers: {
        "api-key": DB_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    }
  )
  return response.data
}

export async function getValidDomains(): Promise<string[]> {
  const DB_API_URL = process.env.DB_API_URL
  const DB_API_KEY = process.env.DB_API_KEY
  const DB_DATA_SOURCE = process.env.DB_DATA_SOURCE
  const DB_DATABASE = process.env.DB_DATABASE
  const DB_ALLOWED_DOMAINS_COLLECTION = process.env.DB_ALLOWED_DOMAINS_COLLECTION
  const response = await axios.post(`${DB_API_URL}/action/find`, {
    dataSource: DB_DATA_SOURCE,
    database: DB_DATABASE,
    collection: DB_ALLOWED_DOMAINS_COLLECTION,
  },
    {
      headers: {
        "api-key": DB_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    }
  )
  return response.data?.documents?.map((document: any) => document?.domain)
}