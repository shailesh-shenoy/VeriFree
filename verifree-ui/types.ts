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
