import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";

import { poseidon } from '@iden3/js-crypto';
import { SchemaHash } from '@iden3/js-iden3-core';
import { Web3 } from 'web3';
const { prepareCircuitArrayValues } = require('@0xpolygonid/js-sdk');

const Operators = {
    NOOP: 0, // No operation, skip query verification in circuit
    EQ: 1, // equal
    LT: 2, // less than
    GT: 3, // greater than
    IN: 4, // in
    NIN: 5, // not in
    NE: 6   // not equal
}

function packValidatorParams(query: any, allowedIssuers = []) {
    let web3 = new Web3(Web3.givenProvider || process.env.QUICKNODE_WSS_URL || 'ws://localhost:8545');
    return web3.eth.abi.encodeParameter(
        {
            CredentialAtomicQuery: {
                schema: 'uint256',
                claimPathKey: 'uint256',
                operator: 'uint256',
                slotIndex: 'uint256',
                value: 'uint256[]',
                queryHash: 'uint256',
                allowedIssuers: 'uint256[]',
                circuitIds: 'string[]',
                skipClaimRevocationCheck: 'bool',
                claimPathNotExists: 'uint256'
            }
        },
        {
            schema: query.schema,
            claimPathKey: query.claimPathKey,
            operator: query.operator,
            slotIndex: query.slotIndex,
            value: query.value,
            queryHash: query.queryHash,
            allowedIssuers: allowedIssuers,
            circuitIds: query.circuitIds,
            skipClaimRevocationCheck: query.skipClaimRevocationCheck,
            claimPathNotExists: query.claimPathNotExists
        }
    );
}

function coreSchemaFromStr(schemaIntString: string) {
    const schemaInt = BigInt(schemaIntString);
    return SchemaHash.newSchemaHashFromInt(schemaInt);
};

function calculateQueryHash(
    values: any,
    schema: any,
    slotIndex: any,
    operator: any,
    claimPathKey: any,
    claimPathNotExists: any
) {
    const expValue = prepareCircuitArrayValues(values, 64);
    const valueHash = poseidon.spongeHashX(expValue, 6);
    const schemaHash = coreSchemaFromStr(schema);
    const quaryHash = poseidon.hash([
        schemaHash.bigInt(),
        BigInt(slotIndex),
        BigInt(operator),
        BigInt(claimPathKey),
        BigInt(claimPathNotExists),
        valueHash
    ]);
    return quaryHash;
}

task('set-zkrequest', 'Gets the balance of MyNFTs for provided address')
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {

        // you can run https://go.dev/play/p/3id7HAhf-Wi to get schema hash and claimPathKey using YOUR schema
        // suggestion: Use your own go application with that code rather than using playground (it can give a timeout just because it’s restricted by the size of dependency package)
        const schemaBigInt = "211858871543568608478507767336162912855"

        const type = 'VerifiedStudentCredential';
        const schemaUrl = "https://raw.githubusercontent.com/shailesh-shenoy/polygonid-issuer-node/main/schemas/verified-student-credential.jsonld";
        // merklized path to field in the W3C credential according to JSONLD  schema e.g. birthday in the KYCAgeCredential under the url "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld"
        const schemaClaimPathKey = "19705724722490875760346503834369389309308496903033124770125286524530240217122"

        const requestId = 1;

        const query = {
            requestId,
            schema: schemaBigInt,
            claimPathKey: schemaClaimPathKey,
            operator: Operators.EQ,
            slotIndex: 0,
            value: [0, ...new Array(63).fill(0)], // for operators 1-3 only first value matters
            circuitIds: ['credentialAtomicQuerySigV2OnChain'],
            skipClaimRevocationCheck: false,
            claimPathNotExists: 0,
            queryHash: ""
        };

        query.queryHash = calculateQueryHash(
            query.value,
            query.schema,
            query.slotIndex,
            query.operator,
            query.claimPathKey,
            query.claimPathNotExists
        ).toString();

        // add the address of the contract just deployed
        const studentVerifierAddress = "0x6c5E97869C703E9DBbd605D1728937C99Bee2f4a"

        const studentVerifier = await hre.ethers.getContractAt("StudentVerifier", studentVerifierAddress)


        const validatorAddress = "0x1E4a22540E293C0e5E8c33DAfd6f523889cFd878"; // sig validator
        // const validatorAddress = "0x0682fbaA2E4C478aD5d24d992069dba409766121"; // mtp validator

        const invokeRequestMetadata = {
            id: '7f38a193-0918-4a48-9fac-36adfdb8b542',
            typ: 'application/iden3comm-plain-json',
            type: 'https://iden3-communication.io/proofs/1.0/contract-invoke-request',
            thid: '7f38a193-0918-4a48-9fac-36adfdb8b542',
            body: {
                reason: 'airdrop participation',
                transaction_data: {
                    contract_address: studentVerifierAddress,
                    method_id: 'b68967e2',
                    chain_id: 80001,
                    network: 'polygon-mumbai'
                },
                scope: [
                    {
                        id: query.requestId,
                        circuitId: query.circuitIds[0],
                        query: {
                            allowedIssuers: ['*'],
                            context: schemaUrl,
                            "credentialSubject": {
                                "studentAddress": {
                                    "$eq": 0
                                }
                            },
                            type
                        }
                    }
                ]
            }
        };

        try {
            const txId = await studentVerifier.setZKPRequest(
                requestId, {
                metadata: JSON.stringify(invokeRequestMetadata),
                validator: validatorAddress,
                data: packValidatorParams(query)
            });
            console.log("Request set: ", txId.hash);
        } catch (e) {
            console.log("error: ", e);
        }
    })