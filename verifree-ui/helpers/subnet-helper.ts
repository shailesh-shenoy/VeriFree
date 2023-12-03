import { AllowListSchema } from "@/types"
import axios from "axios"

export async function updateSubnetAllowList(allowListToUpdate: AllowListSchema): Promise<void> {
    const DB_API_URL = process.env.DB_API_URL
    const DB_API_KEY = process.env.DB_API_KEY
    const DB_DATA_SOURCE = process.env.DB_DATA_SOURCE
    const DB_DATABASE = process.env.DB_DATABASE
    const DB_ALLOW_LIST_COLLECTION = process.env.DB_ALLOW_LIST_COLLECTION
    const VERIFREE_SLEEP_TIME_MS = Number(process.env.VERIFREE_SLEEP_TIME_MS)
    // Sleep for random time between 0 and 10 seconds
    const sleepTime = Math.floor(Math.random() * VERIFREE_SLEEP_TIME_MS);
    await new Promise((resolve) => setTimeout(resolve, sleepTime));
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
    } else if (!deepEqual(allowListInDB.contractAllowList, allowListToUpdate.contractAllowList) || !deepEqual(allowListInDB.transactionAllowList, allowListToUpdate.transactionAllowList)) {
        await axios.post(`${DB_API_URL}/action/updateOne`, {
            dataSource: DB_DATA_SOURCE,
            database: DB_DATABASE,
            collection: DB_ALLOW_LIST_COLLECTION,
            filter: {
                address: allowListToUpdate.address
            },
            update: {
                $set: {
                    contractAllowList: allowListToUpdate.contractAllowList,
                    transactionAllowList: allowListToUpdate.transactionAllowList
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
    if (!allowList.contractAllowList || !allowList.transactionAllowList) {
        return false
    }
    if (!allowList.contractAllowList.hasOwnProperty("enabled") || !allowList.contractAllowList.hasOwnProperty("admin")) {
        return false
    }
    if (!allowList.transactionAllowList.hasOwnProperty("enabled") || !allowList.transactionAllowList.hasOwnProperty("admin")) {
        return false
    }
    return true
}

function deepEqual(object1: any, object2: any) {
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (const key of keys1) {
        const val1 = object1[key];
        const val2 = object2[key];
        const areObjects = isObject(val1) && isObject(val2);
        if (
            areObjects && !deepEqual(val1, val2) ||
            !areObjects && val1 !== val2
        ) {
            return false;
        }
    }

    return true;
}

function isObject(object: any) {
    return object != null && typeof object === 'object';
}
