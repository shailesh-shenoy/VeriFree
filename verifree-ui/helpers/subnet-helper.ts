import { AllowListSchema } from "@/types"
import axios from "axios"
import { getValidDomains } from "./email-helper"
import { privateKeyToAccount } from 'viem/accounts'
import { createPublicClient, createWalletClient, defineChain, getContract, http } from "viem"
import { verifreeSubnetControlAbi } from "./verifree-subnet-control-abi"

export async function updateValidEmailDomainsInDB(validDomain: string): Promise<void> {
    const DB_API_URL = process.env.DB_API_URL
    const DB_API_KEY = process.env.DB_API_KEY
    const DB_DATA_SOURCE = process.env.DB_DATA_SOURCE
    const DB_DATABASE = process.env.DB_DATABASE
    const DB_ALLOWED_DOMAINS_COLLECTION = process.env.DB_ALLOWED_DOMAINS_COLLECTION
    const VERIFREE_SLEEP_TIME_MS = Number(process.env.VERIFREE_SLEEP_TIME_MS)
    // Sleep for random time between 0 and 10 seconds
    const sleepTime = Math.floor(Math.random() * VERIFREE_SLEEP_TIME_MS);
    await new Promise((resolve) => setTimeout(resolve, sleepTime));
    try {

        await axios.post(`${DB_API_URL}/action/insertOne`, {
            dataSource: DB_DATA_SOURCE,
            database: DB_DATABASE,
            collection: DB_ALLOWED_DOMAINS_COLLECTION,
            document: {
                domain: validDomain
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
    }
    catch (error: any) {
        console.log("Domain already in DB")
        return
    }
}

export async function updateSubnetAllowList(allowListToUpdate: AllowListSchema): Promise<void> {
    const DB_API_URL = process.env.DB_API_URL
    const DB_API_KEY = process.env.DB_API_KEY
    const DB_DATA_SOURCE = process.env.DB_DATA_SOURCE
    const DB_DATABASE = process.env.DB_DATABASE
    const DB_ALLOW_LIST_COLLECTION = process.env.DB_ALLOW_LIST_COLLECTION
    const VERIFREE_SLEEP_TIME_MS = Number(process.env.VERIFREE_SLEEP_TIME_MS)
    // Sleep for random time between 0 and X seconds
    const sleepTime = Math.floor(Math.random() * VERIFREE_SLEEP_TIME_MS);
    await new Promise((resolve) => setTimeout(resolve, sleepTime));
    // Convert address to lowercase
    allowListToUpdate.address = allowListToUpdate.address.toLowerCase()

    // Append 0x to the address if it is not there

    if (!allowListToUpdate.address.startsWith("0x")) {
        allowListToUpdate.address = "0x" + allowListToUpdate.address
    }
    const allowListInDB = await getAllowListFromAddress(allowListToUpdate.address)

    if (!allowListInDB) {
        await axios.post(`${DB_API_URL}/action/insertOne`, {
            dataSource: DB_DATA_SOURCE,
            database: DB_DATABASE,
            collection: DB_ALLOW_LIST_COLLECTION,
            document: allowListToUpdate
        },
            {
                headers: {
                    "api-key": DB_API_KEY,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
            }
        )

    } else if (!equalAllowLists(allowListInDB, allowListToUpdate)) {
        await axios.post(`${DB_API_URL}/action/updateOne`, {
            dataSource: DB_DATA_SOURCE,
            database: DB_DATABASE,
            collection: DB_ALLOW_LIST_COLLECTION,
            filter: {
                address: allowListToUpdate.address
            },
            update: {
                $set: {
                    transactionsAllowed: allowListToUpdate.transactionsAllowed,
                    transactionsAdmin: allowListToUpdate.transactionsAdmin,
                    contractsAllowed: allowListToUpdate.contractsAllowed,
                    contractsAdmin: allowListToUpdate.contractsAdmin,
                    mintSubnetVSBT: allowListToUpdate.mintSubnetVSBT
                }
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
    }
    else {
        console.log("Allowlist already up to date")
    }
}

export async function getAllowListFromAddress(address: string): Promise<AllowListSchema> {
    const DB_API_URL = process.env.DB_API_URL
    const DB_API_KEY = process.env.DB_API_KEY
    const DB_DATA_SOURCE = process.env.DB_DATA_SOURCE
    const DB_DATABASE = process.env.DB_DATABASE
    const DB_ALLOW_LIST_COLLECTION = process.env.DB_ALLOW_LIST_COLLECTION
    const response = await axios.post(`${DB_API_URL}/action/findOne`, {
        dataSource: DB_DATA_SOURCE,
        database: DB_DATABASE,
        collection: DB_ALLOW_LIST_COLLECTION,
        filter: {
            address: address
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
    return response.data?.document
}

export function validAllowList(allowList: AllowListSchema): boolean {
    if (!allowList?.address) {
        return false
    }
    if (!allowList.hasOwnProperty("transactionsAllowed")) {
        return false
    }
    if (!allowList.hasOwnProperty("transactionsAdmin")) {
        return false
    }
    if (!allowList.hasOwnProperty("contractsAllowed")) {
        return false
    }
    if (!allowList.hasOwnProperty("contractsAdmin")) {
        return false
    }
    if (!allowList.hasOwnProperty("mintSubnetVSBT")) {
        return false
    }
    return true
}

function equalAllowLists(allowListInDB: AllowListSchema, allowListToUpdate: AllowListSchema) {
    return (
        allowListInDB.address === allowListToUpdate.address &&
        allowListInDB.transactionsAllowed === allowListToUpdate.transactionsAllowed &&
        allowListInDB.transactionsAdmin === allowListToUpdate.transactionsAdmin &&
        allowListInDB.contractsAllowed === allowListToUpdate.contractsAllowed &&
        allowListInDB.contractsAdmin === allowListToUpdate.contractsAdmin &&
        allowListInDB.mintSubnetVSBT === allowListToUpdate.mintSubnetVSBT
    )
}

export async function updateAllowListInSubnet(message: string) {
    // Get Subnet RPC URL from environment variable
    const SUBNET_RPC_URL = process.env.SUBNET_RPC_URL ?? ""
    // Get the private key from environment variable
    const PRIVATE_KEY = process.env.PRIVATE_KEY ?? ""
    // Get Subnet VeriFreeSubnetControl contract address from environment variable
    const SUBNET_CONTROL_ADDRESS = process.env.SUBNET_CONTROL_ADDRESS ?? ""
    const SUBNET_CHAIN_ID = Number(process.env.SUBNET_CHAIN_ID) ?? 0
    const C_CHAIN_ID = process.env.C_CHAIN_ID ?? ""
    const VERIFREE_CONTROL_ADDRESS_C_CHAIN = process.env.VERIFREE_CONTROL_ADDRESS_C_CHAIN ?? ""

    const DB_API_URL = process.env.DB_API_URL
    const DB_API_KEY = process.env.DB_API_KEY
    const DB_DATA_SOURCE = process.env.DB_DATA_SOURCE
    const DB_DATABASE = process.env.DB_DATABASE
    const DB_ALLOWLIST_MESSAGES_COLLECTION = process.env.DB_ALLOWLIST_MESSAGES_COLLECTION

    // 

    const VERIFREE_SLEEP_TIME_MS = Number(process.env.VERIFREE_SLEEP_TIME_MS)
    // Sleep for random time between 0 and X seconds
    const sleepTime = Math.floor(Math.random() * VERIFREE_SLEEP_TIME_MS);
    await new Promise((resolve) => setTimeout(resolve, sleepTime));

    // Append 0x to the message if it is not there
    if (!message.startsWith("0x")) {
        message = "0x" + message
    }

    try {
        // Try to insert the message into the DB. If it already exists, the insert will fail and the catch block will be executed
        await axios.post(`${DB_API_URL}/action/insertOne`, {
            dataSource: DB_DATA_SOURCE,
            database: DB_DATABASE,
            collection: DB_ALLOWLIST_MESSAGES_COLLECTION,
            document: {
                message: message
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

        const account = privateKeyToAccount(`0x${PRIVATE_KEY}`);

        const veriFreeChain = defineChain({
            id: SUBNET_CHAIN_ID,
            name: "VeriFreeSubnet",
            network: "Avalanche Fuji",
            nativeCurrency: {
                decimals: 18,
                name: 'VeriFreeToken',
                symbol: 'VFT',
            },
            rpcUrls: {
                default: {
                    http: [SUBNET_RPC_URL],
                },
                public: {
                    http: [SUBNET_RPC_URL],
                },
            }
        })

        const walletClient = createWalletClient({
            account,
            chain: veriFreeChain,
            transport: http()
        })

        const publicClient = createPublicClient({
            chain: veriFreeChain,
            transport: http()
        })

        const { request, result } = await publicClient.simulateContract({
            account,
            address: SUBNET_CONTROL_ADDRESS as `0x${string}`,
            abi: verifreeSubnetControlAbi,
            functionName: "receiveTeleporterMessage",
            args: [C_CHAIN_ID as `0x${string}`, VERIFREE_CONTROL_ADDRESS_C_CHAIN as `0x${string}`, message as `0x${string}`]
        })

        const txHash = await walletClient.writeContract(request);

        console.log(`Transaction hash: ${txHash}`);

        // Store the transaction hash in the DB with the message
        // No need to wait for this to finish
        axios.post(`${DB_API_URL}/action/updateOne`, {
            dataSource: DB_DATA_SOURCE,
            database: DB_DATABASE,
            collection: DB_ALLOWLIST_MESSAGES_COLLECTION,
            filter: {
                message: message
            },
            update: {
                $set: {
                    transactionHash: txHash
                }
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

    }
    catch (error: any) {
        console.log("Message already in DB")
        return
    }
}

