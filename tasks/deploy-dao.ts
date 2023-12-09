

import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getPrivateKey, getProviderRpcUrl, getRouterConfig } from "./utils";
import { Wallet, ethers } from "ethers";
import { DestinationVSBTMinter } from "../typechain-types";
import { Spinner } from "../utils/spinner";

task(`deploy-dao`, `Deploys VeriFreeDAO.sol contract with VSBT as voting token`)
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const routerAddress = taskArguments.router ? taskArguments.router : getRouterConfig(hre.network.name).address;

        const privateKey = getPrivateKey();
        const rpcProviderUrl = getProviderRpcUrl(hre.network.name);

        const provider = new ethers.JsonRpcProvider(rpcProviderUrl);
        const wallet = new Wallet(privateKey);
        const deployer = wallet.connect(provider);

        const spinner: Spinner = new Spinner();

        const vsbtAddress = "0x06d494344d71Af2146611aA6FAFf8e46959D2292"

        spinner.start();

        const veriFreeDAO = await hre.ethers.deployContract("VeriFreeDAO", [vsbtAddress]);

        await veriFreeDAO.waitForDeployment();

        spinner.stop();
        console.log(`✅ VeriFree contract deployed at address ${veriFreeDAO.target} with VSBT contract at ${vsbtAddress} on the ${hre.network.name} blockchain`);
    })