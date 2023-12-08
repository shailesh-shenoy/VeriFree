
import fs from "fs";
import path from "path";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getEncryptedGistURL, getPrivateKey, getProviderRpcUrl, getRouterConfig } from "./utils";
import { ethers } from "ethers";
import { DestinationVSBTMinter, VeriFreeControl, VeriFreeSubnetControl } from "../typechain-types";
import { Spinner } from "../utils/spinner";
import { LINK_ADDRESSES } from "./constants";
task(`deploy-verifree-subnet-control`, `Deploys VeriFreeSubnetControl.sol contract implements a teleporter Receiver`)
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {

        const privateKey = getPrivateKey();
        const rpcProviderUrl = getProviderRpcUrl(hre.network.name);

        const provider = new ethers.JsonRpcProvider(rpcProviderUrl);
        const wallet = new ethers.Wallet(privateKey);
        const deployer = wallet.connect(provider);

        const spinner: Spinner = new Spinner();


        const txAllowListPrecompileAddress = "0x0200000000000000000000000000000000000002";
        const contractAllowListPrecompileAddress = "0x0200000000000000000000000000000000000000"
        const nativeMinterPrecompileAddress = "0x0200000000000000000000000000000000000001"

        const teleporterMesenger = wallet.address;
        console.log(`ℹ️  teleporterMesenger: ${teleporterMesenger}`);

        const cChainOriginId = ethers.encodeBytes32String("1111111111111111111111111LpoYY");
        console.log(`ℹ️  cChainOriginId in bytes32: ${cChainOriginId}`);
        console.log(`ℹ️  cChainOriginId decoded: ${ethers.decodeBytes32String(cChainOriginId)}`);

        const verifreeControlAddressCChain = "0x1ac16DDefA7F428CA761972eFE2FC6Eaf686ec0c";

        const nativeCoinAmount = ethers.parseEther("1000");
        console.log(`ℹ️  nativeCoinAmount: ${nativeCoinAmount}`);

        const tokenUri = "https://ipfs.io/ipfs/QmRU1p26avetiPsg2goTUhySZDbEwXxMaYU4DCCkpc5xnP";

        spinner.start();

        const veriFreeSubnetControl: VeriFreeSubnetControl = await hre.ethers.deployContract("VeriFreeSubnetControl", [
            txAllowListPrecompileAddress,
            contractAllowListPrecompileAddress,
            nativeMinterPrecompileAddress,
            teleporterMesenger,
            cChainOriginId,
            verifreeControlAddressCChain,
            nativeCoinAmount,
            tokenUri
        ]);

        console.log(`✅ VeriFreeSubnetControl contract deployed at address ${veriFreeSubnetControl.target} on the ${hre.network.name} blockchain`);

        const vsbtAddress = await veriFreeSubnetControl.vsbt();

        console.log(`ℹ️  VSBT contract address: ${vsbtAddress}`);

        spinner.stop();


    })