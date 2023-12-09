
import { task } from "hardhat/config";
import { getPrivateKey, getProviderRpcUrl } from "./utils";
import { Wallet, ethers } from "ethers";
import { Spinner } from "../utils/spinner";

task("test-add-domain", "Initialize VeriFree control contract and test adding a domain")
    .setAction(async (taskArgs, hre) => {
        // Deploy VeriFree control contract
        const privateKey = getPrivateKey();
        const rpcProviderUrl = getProviderRpcUrl(hre.network.name);

        const provider = new ethers.JsonRpcProvider(rpcProviderUrl);
        const wallet = new Wallet(privateKey);
        const deployer = wallet.connect(provider);

        const spinner = new Spinner();

        spinner.start();

        const domainToAdd = "sjsu.edu";
        const veriFreeControl = await hre.ethers.getContractAt("VeriFreeControl", "0x1ac16DDefA7F428CA761972eFE2FC6Eaf686ec0c");

        console.log(`ℹ️  Attempting to add domain ${domainToAdd} to VeriFreeControl contract ${veriFreeControl.target} on the ${hre.network.name} blockchain`);
        const requestTx = await veriFreeControl.addValidDomains(domainToAdd);

        spinner.stop();
        console.log(`✅ Domain ${domainToAdd} added successfully!`);
        console.log(`ℹ Transaction hash: ${requestTx.hash}`);
        // Test adding a domain
        const txReceipt = await requestTx.wait(1);

    });

export default {};
