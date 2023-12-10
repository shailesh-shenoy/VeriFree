import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getPrivateKey, getProviderRpcUrl } from "./utils";
import { Wallet, ethers } from "ethers";
import { Spinner } from "../utils/spinner";
import { add } from "@iden3/js-crypto/dist/types/ff/scalar";

task('allow-admin-on-verifree-control', 'Updates the allowed admin address on the VeriFreeControl contract')
    .addParam(`addressToAllow`, `The address to allow as an admin on the VeriFreeControl contract`)
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const privateKey = getPrivateKey();
        const rpcProviderUrl = getProviderRpcUrl(hre.network.name);

        const provider = new ethers.JsonRpcProvider(rpcProviderUrl);
        const wallet = new Wallet(privateKey);
        const deployer = wallet.connect(provider);

        const spinner: Spinner = new Spinner();

        // Address from the command line
        const addressToAllow = taskArguments.addressToAllow;
        const veriFreeControlAddress = "0xE087BF9144Be0bfEeCBfbB74F873d5Db122EfDBF"

        console.log(`ℹ️  Attempting to allow address ${addressToAllow} to invoke VeriFreeControl contract ${veriFreeControlAddress} on the ${hre.network.name} blockchain`);
        spinner.start();
        // Get the deployed destinationMinter contract with the address
        const veriFreeControl = await hre.ethers.getContractAt("VeriFreeControl", veriFreeControlAddress);
        await veriFreeControl.updateAllowListedAdmins(addressToAllow, true);

        spinner.stop();

        console.log(`✅ Allowed address ${addressToAllow} to invoke veriFreeControl contract at ${veriFreeControl.target} on the ${hre.network.name} blockchain`);
    })