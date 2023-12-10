import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getPrivateKey, getProviderRpcUrl } from "./utils";
import { Wallet, ethers } from "ethers";
import { Spinner } from "../utils/spinner";
import { LINK_ADDRESSES } from "./constants";

task('balance-of', 'Gets the link balance of an address')
    .addParam(`addressToCheck`, `The address to acheck link balance of`)
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const privateKey = getPrivateKey();
        const rpcProviderUrl = getProviderRpcUrl(hre.network.name);

        const provider = new ethers.JsonRpcProvider(rpcProviderUrl);
        const wallet = new Wallet(privateKey);
        const deployer = wallet.connect(provider);

        const spinner: Spinner = new Spinner();

        const addr = taskArguments.addressToCheck;

        const linkAddress = LINK_ADDRESSES[hre.network.name]

        spinner.start();


        const linkToken = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", linkAddress);
        const balance = await linkToken.balanceOf(addr);

        spinner.stop();

        const linkAmount = ethers.formatEther(balance);

        console.log(`✅ ${addr} has ${balance} Joules / ${linkAmount} LINK on the ${hre.network.name} blockchain`);
    })