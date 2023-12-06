import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getPrivateKey, getProviderRpcUrl } from "./utils";
import { Wallet, ethers } from "ethers";
import { Spinner } from "../utils/spinner";

task('allow', 'Updates the allowed source address on the DestinationMinter contract')
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const privateKey = getPrivateKey();
        const rpcProviderUrl = getProviderRpcUrl(hre.network.name);

        const provider = new ethers.JsonRpcProvider(rpcProviderUrl);
        const wallet = new Wallet(privateKey);
        const deployer = wallet.connect(provider);

        const spinner: Spinner = new Spinner();

        const destinationMinterAddress = "0x1FEF52237b648dA7FD5c48878ca7DEB306B57339"
        const allowedSenderAddress = "0x6c5E97869C703E9DBbd605D1728937C99Bee2f4a"

        spinner.start();
        // Get the deployed destinationMinter contract with the address
        const destinationVSBTMinter = await hre.ethers.getContractAt("DestinationVSBTMinter", destinationMinterAddress);
        await destinationVSBTMinter.updateSender(allowedSenderAddress, true);

        spinner.stop();

        console.log(`✅ DestinationMinter contract deployed at address ${destinationVSBTMinter.target} updated with ${allowedSenderAddress} as an allowedSender on the ${hre.network.name} blockchain`);
    })