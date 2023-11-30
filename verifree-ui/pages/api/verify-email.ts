import type { NextApiRequest, NextApiResponse } from "next";

import { handleEmailFire } from "@/helpers/email-helper";
import { IssueDetails, IssueRequest } from "@/types";
import {
  createAuthLinkQRCode,
  createLink,
  generateQRCode,
} from "@/helpers/issuer-api-helper";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case "POST":
      const issueRequest: IssueRequest = req.body;

      if (
        !issueRequest.studentEmail ||
        !issueRequest.address ||
        !issueRequest.addressLast15
      ) {
        return res.status(400).json({ message: "Missing fields" });
      }
      try {
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
