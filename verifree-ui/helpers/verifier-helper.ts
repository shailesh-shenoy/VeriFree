import { generateQRCode } from "./issuer-api-helper";

export interface VerificationQRCodeData {
    verificationQRCodeSrc: string;
    verificationQRCodeJson: string;
}

export async function getVerificationQRCodeSrc(addressLast15: number): Promise<VerificationQRCodeData> {
    const verifierContractAddress = process.env.NEXT_PUBLIC_VERIFIER_CONTRACT_ADDRESS;
    const verifierJsonLdContext = process.env.NEXT_PUBLIC_VERIFIER_JSONLD_CONTEXT;
    const qrCodeJson = {
        "id": "7f38a193-0918-4a48-9fac-36adfdb8b542",
        "typ": "application/iden3comm-plain-json",
        "type": "https://iden3-communication.io/proofs/1.0/contract-invoke-request",
        "thid": "7f38a193-0918-4a48-9fac-36adfdb8b542",
        "body": {
            "reason": "On-chain Student Verification",
            "transaction_data": {
                "contract_address": verifierContractAddress,
                "method_id": "b68967e2",
                "chain_id": 80001,
                "network": "polygon-mumbai"
            },
            "scope": [
                {
                    "id": 1,
                    "circuitId": "credentialAtomicQuerySigV2OnChain",
                    "query": {
                        "allowedIssuers": [
                            "*"
                        ],
                        "context": verifierJsonLdContext,
                        "credentialSubject": {
                            "studentAddress": {
                                "$eq": addressLast15
                            }
                        },
                        "type": "VerifiedStudentCredential"
                    }
                }
            ]
        }
    }
    const verificationQRCodeJson = JSON.stringify(qrCodeJson)
    const verificationQRCodeSrc = await generateQRCode(verificationQRCodeJson)
    const verificationQRCodeData = {
        verificationQRCodeSrc,
        verificationQRCodeJson
    }
    return verificationQRCodeData
} 