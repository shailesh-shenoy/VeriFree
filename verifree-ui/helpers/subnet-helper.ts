import { AllowListSchema } from "@/types"
import axios from "axios"
import { getValidDomains } from "./email-helper"

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
    const validDomainsInDB = await getValidDomains()
    if (!validDomainsInDB.includes(validDomain)) {
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
    else {
        console.log("Valid domain already in DB")
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

