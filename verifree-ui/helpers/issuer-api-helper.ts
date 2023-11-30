import { IssueRequest, StudentVCSchema, VSLinkQRCodeSchema } from "@/types";
import axios from "axios";
import QRCode from "qrcode";

const issuerApiUrl = process.env.ISSUER_API_URL ?? "";
const issuerApiUser = process.env.ISSUER_API_USER ?? "";
const issuerApiPassword = process.env.ISSUER_API_PASSWORD ?? "";
const issuerCreateLinkUri = process.env.ISSUER_CREATE_LINK_URI ?? "";
const issuerSchemaId = process.env.ISSUER_SCHEMA_ID ?? "";
const expirationTimeInMinutes =
  Number(process.env.ISSUER_CLAIM_EXPIRY_MIN) ?? 0;

export const createLink = async (
  issueRequest: IssueRequest
): Promise<{ linkId: string; claimLinkExpiration: Date }> => {
  const auth = {
    username: issuerApiUser,
    password: issuerApiPassword,
  };
  const authorizationHeader = Buffer.from(
    `${auth.username}:${auth.password}`
  ).toString("base64");

  const claimLinkExpiration = new Date(
    new Date().getTime() + expirationTimeInMinutes * 60000
  );
  const creatLinkRequest: StudentVCSchema = {
    schemaID: issuerSchemaId,
    claimLinkExpiration: claimLinkExpiration.toISOString(),
    limitedClaims: 1,
    signatureProof: true,
    mtProof: false,
    credentialSubject: {
      studentAddress: issueRequest.addressLast15,
      isVerifiedStudent: true,
      studentEmail: issueRequest.studentEmail,
    },
  };

  //   let config = {
  //     method: "POST",
  //     maxBodyLength: Infinity,
  //     url: `${issuerApiUrl}/${issuerCreateLinkUri}`,
  //     headers: {
  //       authorization: `Basic ${authorizationHeader}`,
  //       "Content-Type": "application/json",
  //     },
  //     data: JSON.stringify(creatLinkRequest),
  //   };

  const response = await axios.post(
    `${issuerApiUrl}/${issuerCreateLinkUri}`,
    creatLinkRequest,
    {
      auth: {
        username: issuerApiUser,
        password: issuerApiPassword,
      },
    }
  );
  //   const response = await axios.request(config);
  // Handle error by checking the response status code against 2xx HTTP status codes

  if (response.status !== 201) {
    throw new Error(
      `Error while creating VC issue link: ${response.statusText}`
    );
  }
  const linkId: string = response.data?.id ?? "";
  return { linkId, claimLinkExpiration };
};

export const createAuthLinkQRCode = async (linkId: string): Promise<string> => {
  const response = await axios.post(
    `${issuerApiUrl}/${issuerCreateLinkUri}/${linkId}/qrcode`,
    {
      auth: {
        username: issuerApiUser,
        password: issuerApiPassword,
      },
    }
  );
  // Handle error by chexking the response status code against 2xx HTTP status codes

  if (response.status !== 200) {
    throw new Error(
      `Error while creating VC issue link: ${response.statusText}`
    );
  }
  const qrCodeData: VSLinkQRCodeSchema = response.data;
  if (!qrCodeData || !qrCodeData.qrCode) {
    throw new Error(`Error while creating QR code data`);
  }
  return qrCodeData.qrCode;
};

export async function generateQRCode(qrCodeLink: string): Promise<string> {
  return await QRCode.toDataURL(qrCodeLink, { type: "image/png" });
}
