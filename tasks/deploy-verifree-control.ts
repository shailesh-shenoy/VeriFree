
import fs from "fs";
import path from "path";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getEncryptedGistURL, getPrivateKey, getProviderRpcUrl, getRouterConfig } from "./utils";
import { ethers } from "ethers";
import { DestinationVSBTMinter, VeriFreeControl } from "../typechain-types";
import { Spinner } from "../utils/spinner";
import { LINK_ADDRESSES } from "./constants";
task(`deploy-verifree-control`, `Deploys VeriFreeControl.sol contract which uses chainlink functions to update the valid domains and allowlist on subnet`)
    .addOptionalParam(`router`, `The address of the Router contract on the destination blockchain`)
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {


        const privateKey = getPrivateKey();
        const rpcProviderUrl = getProviderRpcUrl(hre.network.name);
        const encryptedGistURL = getEncryptedGistURL();

        const provider = new ethers.JsonRpcProvider(rpcProviderUrl);
        const wallet = new ethers.Wallet(privateKey);
        const deployer = wallet.connect(provider);

        const spinner: Spinner = new Spinner();

        // CL functions parameters
        const router = "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0"
        // const donHostedSecretsSlotID = 0;
        const subscriptionId = 1618;
        const donId = "fun-avalanche-fuji-1";
        const donIdBytes32 = ethers.encodeBytes32String(donId);
        const gasLimit = 300000;
        const validDomainsSourceJS = fs.readFileSync(path.join(__dirname, "../chainlink-functions/addValidDomain.js")).toString();
        const allowListSourceJS = fs.readFileSync(path.join(__dirname, "../chainlink-functions/updateSubnetAllowList.js")).toString();

        spinner.start();

        const veriFreeControl: VeriFreeControl = await hre.ethers.deployContract("VeriFreeControl", [
            router,
            encryptedGistURL,
            subscriptionId,
            donIdBytes32,
            gasLimit,
            validDomainsSourceJS,
            allowListSourceJS
        ]);

        await veriFreeControl.waitForDeployment();
        console.log(`✅ VeriFreeControl contract deployed at address ${veriFreeControl.target} on the ${hre.network.name} blockchain`);
        const encryptedRefOnChain = await veriFreeControl.encryptedSecretsURL();
        console.log(`ℹ️  Encrypted secrets URL in contract: ${encryptedRefOnChain}`);
        spinner.stop();
    })