import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getPrivateKey, getProviderRpcUrl } from "./utils";
import { Wallet, ethers } from "ethers";
import { Spinner } from "../utils/spinner";

task('allow-sender-on-destination-minter', 'Updates the allowed source address on the DestinationVSBTMinter contract')
    .addParam(`addressToAllow`, `The address to allow as a sender on the DestinationMinter contract`)
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const privateKey = getPrivateKey();
        const rpcProviderUrl = getProviderRpcUrl(hre.network.name);

        const provider = new ethers.JsonRpcProvider(rpcProviderUrl);
        const wallet = new Wallet(privateKey);
        const deployer = wallet.connect(provider);

        const spinner: Spinner = new Spinner();

        const allowedSenderAddress = taskArguments.addressToAllow;

        const destinationMinterAddress = "0x1436bD3d666D2904622c1Dee7A4b43c198084046"; // DestinationMinter address on Avalanche Fuji

        spinner.start();

        console.log(`ℹ️  Attempting to allow address ${allowedSenderAddress} to invoke DestinationMinter contract ${destinationMinterAddress} on the ${hre.network.name} blockchain`);
        // Get the deployed destinationMinter contract with the address
        const destinationVSBTMinter = await hre.ethers.getContractAt("DestinationVSBTMinter", destinationMinterAddress);
        await destinationVSBTMinter.updateSender(allowedSenderAddress, true);

        spinner.stop();

        console.log(`✅ DestinationMinter contract deployed at address ${destinationVSBTMinter.target} updated with ${allowedSenderAddress} as an allowedSender on the ${hre.network.name} blockchain`);
    })