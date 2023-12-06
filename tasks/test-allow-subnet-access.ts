
import { task } from "hardhat/config";
import { getPrivateKey, getProviderRpcUrl } from "./utils";
import { Wallet, ethers } from "ethers";
import { Spinner } from "../utils/spinner";

task("test-allow-subnet-access", "Allow access to given address on subnet")
    .setAction(async (taskArgs, hre) => {
        // Deploy VeriFree control contract
        const privateKey = getPrivateKey();
        const rpcProviderUrl = getProviderRpcUrl(hre.network.name);

        const provider = new ethers.JsonRpcProvider(rpcProviderUrl);
        const wallet = new Wallet(privateKey);
        const deployer = wallet.connect(provider);

        const spinner = new Spinner();

        spinner.start();

        const addressToUpdate = "0x2dEE2342b526546E6aE2C61b05D2FBb3464dE50d"
        const transactionsAllowed = true;
        const transactionsAdmin = false;
        const contractsAllowed = true;
        const contractsAdmin = false;
        const mintSubnetVSBT = true;
        const veriFreeControl = await hre.ethers.getContractAt("VeriFreeControl", "0x7dBE168BBd6E29750134226d97BFcbc01748A733");

        console.log(`ℹ️  Attempting to add update permissions for ${addressToUpdate} on VeriFreeControl contract ${veriFreeControl.target} on the ${hre.network.name} blockchain`);
        const requestTx = await veriFreeControl.updateSubnetAllowList(addressToUpdate, transactionsAllowed, transactionsAdmin, contractsAllowed, contractsAdmin, mintSubnetVSBT);

        spinner.stop();
        console.log(`✅ Address ${addressToUpdate} updated successfully!`);
        console.log(`ℹ Transaction hash: ${requestTx.hash}`);
        // Test adding a domain
        const txReceipt = await requestTx.wait(1);

        console.log(JSON.stringify(txReceipt));

    });

export default {};
