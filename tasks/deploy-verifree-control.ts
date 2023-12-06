
import fs from "fs";
import path from "path";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getPrivateKey, getProviderRpcUrl, getRouterConfig } from "./utils";
import { ethers } from "ethers";
import { DestinationVSBTMinter, VeriFreeControl } from "../typechain-types";
import { Spinner } from "../utils/spinner";
import { LINK_ADDRESSES } from "./constants";
task(`deploy-verifree-control`, `Deploys VeriFreeControl.sol contract which uses chainlink functions to update the valid domains and allowlist on subnet`)
    .addOptionalParam(`router`, `The address of the Router contract on the destination blockchain`)
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {


        const privateKey = getPrivateKey();
        const rpcProviderUrl = getProviderRpcUrl(hre.network.name);

        const provider = new ethers.JsonRpcProvider(rpcProviderUrl);
        const wallet = new ethers.Wallet(privateKey);
        const deployer = wallet.connect(provider);

        const spinner: Spinner = new Spinner();

        // CL functions parameters
        const router = "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0"
        // const donHostedSecretsSlotID = 0;
        const encryptedSecretsReference = "0xa266736c6f744964006776657273696f6e1a656f89a6" // Will expire, set to a new one frequently
        const subscriptionId = 1618;
        const donId = "fun-avalanche-fuji-1";
        const donIdBytes32 = ethers.encodeBytes32String(donId);
        const gasLimit = 300000;
        const validDomainsSourceJS = fs.readFileSync(path.join(__dirname, "../chainlink-functions/addValidDomain.js")).toString();
        const allowListSourceJS = fs.readFileSync(path.join(__dirname, "../chainlink-functions/updateSubnetAllowList.js")).toString();

        // const gatewayUrls = [
        //     "https://01.functions-gateway.testnet.chain.link/",
        //     "https://02.functions-gateway.testnet.chain.link/",
        // ];
        // const explorerUrl = "https://testnet.snowtrace.io/";

        // const domainArgs = ["@northeastern.edu"]
        // const allowListArgs = ["0x6c5E97869C703E9DBbd605D1728937C99Bee2f4a", "true", "true", "true", "false"]

        spinner.start();

        const veriFreeControl: VeriFreeControl = await hre.ethers.deployContract("VeriFreeControl", [
            router,
            encryptedSecretsReference,
            subscriptionId,
            donIdBytes32,
            gasLimit,
            validDomainsSourceJS,
            allowListSourceJS
        ]);

        await veriFreeControl.waitForDeployment();
        const encryptedRefOnChain = await veriFreeControl.encryptedSecretsReference();

        console.log(`✅ VeriFreeControl contract deployed at address ${veriFreeControl.target} on the ${hre.network.name} blockchain`);

    })