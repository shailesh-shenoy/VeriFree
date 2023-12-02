import type { NextApiRequest, NextApiResponse } from "next";

import { addVerifiedEmail, emailAlreadyVerified, handleEmailFire, validEmailDomain } from "@/helpers/email-helper";
import { IssueDetails, IssueRequest } from "@/types";
import {
  createAuthLinkQRCode,
  createLink,
  generateQRCode,
} from "@/helpers/issuer-api-helper";
import { fromHex } from "viem";
import { check } from "prettier";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case "POST":
      const issueRequest: IssueRequest = req.body;
      const { studentEmail, address, addressLast15 } = issueRequest;

      if (
        !studentEmail ||
        !address ||
        !addressLast15
      ) {
        return res.status(400).json({ message: "Missing fields" });
      }
      try {
        const addressBigInt = BigInt(fromHex(address as `0x${string}`, "bigint")) ?? BigInt(0);
        if (addressBigInt === BigInt(0)) {
          return res.status(400).json({ message: "Invalid address" });
        }
        const addressLast15FromAddress = Number(
          addressBigInt % BigInt(1000000000000000) ?? BigInt(0)
        );
        if (addressLast15FromAddress !== addressLast15) {
          return res.status(400).json({ message: "addressLast15 sent does not match sent address" });
        }
        if (!(await validEmailDomain(studentEmail))) {
          return res.status(400).json({ message: "Invalid email domain" });
        }
        if (await emailAlreadyVerified(studentEmail)) {
          return res.status(400).json({ message: "Email already verified" });
        }

        const { linkId, claimLinkExpiration } = await createLink(issueRequest);
        if (!linkId) {
          return res.status(500).json({ message: "Error while creating link" });
        }

        const qrCodeLink = await createAuthLinkQRCode(linkId);
        const qrCodeData = await generateQRCode(qrCodeLink);

        const issueDetails: IssueDetails = {
          ...issueRequest,
          qrCodeData,
          expirationDate: claimLinkExpiration,
        };
        await handleEmailFire(issueDetails);
        await addVerifiedEmail(studentEmail);
        return res
          .status(200)
          .json({ message: "Email sent to the provided email address" });
      } catch (error: any) {
        return res.status(500).json({ message: error?.message });
      }
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}
