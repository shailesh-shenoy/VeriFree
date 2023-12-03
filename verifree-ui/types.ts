//Credentials Schema

export interface StudentVCSchema {
  schemaID: string;
  claimLinkExpiration: string;
  limitedClaims: number;
  signatureProof: boolean;
  mtProof: boolean;
  credentialSubject: CredentialSubject;
}

export interface CredentialSubject {
  studentAddress: number;
  isVerifiedStudent: boolean;
  studentEmail: string;
}

// Issue schemas

export interface IssueRequest {
  studentEmail: string;
  address: string;
  addressLast15: number;
}

export interface IssueDetails {
  studentEmail: string;
  address: string;
  addressLast15: number;
  qrCodeData: string;
  expirationDate: Date;
}

//Link Schema

export interface VSLinkQRCodeSchema {
  issuer: Issuer;
  linkDetail: LinkDetail;
  qrCode: string;
  sessionID: string;
}

export interface Issuer {
  displayName: string;
  logo: string;
}

export interface LinkDetail {
  id: string;
  proofTypes: string[];
  schemaHash: string;
  schemaType: string;
  schemaUrl: string;
}

interface NavItem {
  label: string;
  link: string;
}

export const NAV_ITEMS: Array<NavItem> = [
  {
    label: "Get Verified",
    link: "/get-verified",
  },
  {
    label: "Publish Onchain Proof",
    link: "/publish-onchain-proof",
  },
  {
    label: "DAO",
    link: process.env.NEXT_PUBLIC_VERIFREE_DAO_URL || "",
  },
];

export const ABOUT_ITEMS: Array<NavItem> = [
  {
    label: "How it works",
    link: "/how-it-works",
  },
  {
    label: "Github",
    link: "https://github.com/shailesh-shenoy/wagerwinz",
  },
  {
    label: "VeriFree Subnet",
    link: `/`,
  },
];

export type { NavItem };

//VerFree Subnet Schema

export interface AllowListSchema {
  address: string;
  contractAllowList: AllowList;
  transactionAllowList: AllowList;
}

export interface ID {
  $oid: string;
}

export interface AllowList {
  enabled: boolean;
  admin: boolean;
}
