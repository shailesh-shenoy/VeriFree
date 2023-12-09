import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getPrivateKey, getProviderRpcUrl, getRouterConfig } from "./utils";
import { Wallet, ethers } from "ethers";
import { StudentVerifier } from "../typechain-types";
import { Spinner } from "../utils/spinner";
import { LINK_ADDRESSES } from "./constants";


task(`deploy-student-verifier`, `Deploys StudentVerifier.sol smart contract which verifies student credentials and sends CCIP Request to the destination blockchain's DestinationVSBTMinter contract`)
    .addOptionalParam(`router`, `The address of the Router contract on the source blockchain`)
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const routerAddress = taskArguments.router ? taskArguments.router : getRouterConfig(hre.network.name).address;
        const linkAddress = taskArguments.link ? taskArguments.link : LINK_ADDRESSES[hre.network.name]
        const destinationChainSelector = getRouterConfig("avalancheFuji").chainSelector;
        const destinationMinterAddress = "0x1436bD3d666D2904622c1Dee7A4b43c198084046"; // DestinationMinter address on Avalanche Fuji

        const privateKey = getPrivateKey();
        const rpcProviderUrl = getProviderRpcUrl(hre.network.name);

        const provider = new ethers.JsonRpcProvider(rpcProviderUrl);
        const wallet = new Wallet(privateKey);
        const deployer = wallet.connect(provider);
        const linkToken = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", linkAddress);
        // Set the gas limit to 500000
        const ccipGasLimit = 500000;

        const spinner: Spinner = new Spinner();

        console.log(`ℹ️  Attempting to deploy StudentVerifier smart contract on the ${hre.network.name} blockchain using ${deployer.address} address, with the Router address ${routerAddress}, destinationChain ${destinationChainSelector}, destinationMinterAddress ${destinationMinterAddress} and LINK address ${linkAddress} provided as constructor arguments`);
        spinner.start();

        const studentVerifier: StudentVerifier = await hre.ethers.deployContract("StudentVerifier", [routerAddress, destinationChainSelector, destinationMinterAddress, linkAddress, ccipGasLimit],
            {
                libraries: {
                    PoseidonFacade: "0xD65f5Fc521C4296723c6Eb16723A8171dCC12FB0"
                }
            }
        );
        await studentVerifier.waitForDeployment();

        spinner.stop();
        console.log(`✅ StudentVerifier contract deployed at address ${studentVerifier.target} on the ${hre.network.name} blockchain`);

        // Transfer 2 LINK to the StudentVerifier contract
        const linkAmount = ethers.parseEther("2");
        const transferTx = await linkToken.transfer(studentVerifier.target, linkAmount);
        const ccipLimitInContract = await studentVerifier.ccipGasLimit();

        console.log(`✅ ${linkAmount} LINK Joules token transferred to StudentVerifier contract. Transaction hash: ${transferTx.hash}`);
        console.log(`✅ ccipGasLimit in StudentVerifier contract: ${ccipLimitInContract}`);
    })