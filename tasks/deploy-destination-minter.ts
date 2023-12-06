

import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getPrivateKey, getProviderRpcUrl, getRouterConfig } from "./utils";
import { Wallet, ethers } from "ethers";
import { DestinationVSBTMinter } from "../typechain-types";
import { Spinner } from "../utils/spinner";

task(`deploy-destination-minter`, `Deploys DestinationVSBTMinter.sol smart contracts which deploys a VSBT contract during initialization and mints VSBT tokens on the destination blockchain`)
    .addOptionalParam(`router`, `The address of the Router contract on the destination blockchain`)
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const routerAddress = taskArguments.router ? taskArguments.router : getRouterConfig(hre.network.name).address;

        const privateKey = getPrivateKey();
        const rpcProviderUrl = getProviderRpcUrl(hre.network.name);

        const provider = new ethers.JsonRpcProvider(rpcProviderUrl);
        const wallet = new Wallet(privateKey);
        const deployer = wallet.connect(provider);

        const spinner: Spinner = new Spinner();

        const tokenUri = "https://ipfs.io/ipfs/QmRU1p26avetiPsg2goTUhySZDbEwXxMaYU4DCCkpc5xnP"

        spinner.start();

        const _initialSourceChainSelector = getRouterConfig("polygonMumbai").chainSelector;

        const destinationVSBTMinter: DestinationVSBTMinter = await hre.ethers.deployContract("DestinationVSBTMinter", [routerAddress, _initialSourceChainSelector, tokenUri]);
        await destinationVSBTMinter.waitForDeployment();


        spinner.stop();
        const vsbtAddress = await destinationVSBTMinter.vsbt();
        console.log(`✅ DestinationMinter contract deployed at address ${destinationVSBTMinter.target} with VSBT contract at ${vsbtAddress} on the ${hre.network.name} blockchain`);

    })