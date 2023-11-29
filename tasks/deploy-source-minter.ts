import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getPrivateKey, getProviderRpcUrl, getRouterConfig } from "./utils";
import { Wallet, ethers } from "ethers";
import { StudentVerifier } from "../typechain-types";
import { Spinner } from "../utils/spinner";
import { LINK_ADDRESSES } from "./constants";


task(`deploy-source-minter`, `Deploys SourceMinter.sol smart contract`)
    .addOptionalParam(`router`, `The address of the Router contract on the source blockchain`)
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const routerAddress = taskArguments.router ? taskArguments.router : getRouterConfig(hre.network.name).address;
        const linkAddress = taskArguments.link ? taskArguments.link : LINK_ADDRESSES[hre.network.name]
        const destinationChainSelector = getRouterConfig("avalancheFuji").chainSelector;
        const receiverAddress = "0x1FEF52237b648dA7FD5c48878ca7DEB306B57339"; // DestinationMinter address on Avalanche Fuji

        const privateKey = getPrivateKey();
        const rpcProviderUrl = getProviderRpcUrl(hre.network.name);

        const provider = new ethers.JsonRpcProvider(rpcProviderUrl);
        const wallet = new Wallet(privateKey);
        const deployer = wallet.connect(provider);
        const linkToken = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", linkAddress);

        const spinner: Spinner = new Spinner();

        console.log(`ℹ️  Attempting to deploy StudentVerifier smart contract on the ${hre.network.name} blockchain using ${deployer.address} address, with the Router address ${routerAddress}. receiverAddress ${receiverAddress} and LINK address ${linkAddress} provided as constructor arguments`);
        spinner.start();

        const studentVerifier: StudentVerifier = await hre.ethers.deployContract("StudentVerifier", [routerAddress, destinationChainSelector, receiverAddress, linkAddress],
            {
                libraries: {
                    PoseidonFacade: "0xD65f5Fc521C4296723c6Eb16723A8171dCC12FB0"
                }
            }
        );
        await studentVerifier.waitForDeployment();

        spinner.stop();
        console.log(`✅ SourceMinter contract deployed at address ${studentVerifier.target} on the ${hre.network.name} blockchain`);

        // Transfer 2 LINK to the StudentVerifier contract

        const transferTx = await linkToken.transfer(studentVerifier.target, 2);

        console.log(`✅ 2 LINK token transferred to SourceMinter contract. Transaction hash: ${transferTx.hash}`);
    })