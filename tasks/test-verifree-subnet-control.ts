
import { task } from "hardhat/config";
import { getPrivateKey, getProviderRpcUrl } from "./utils";
import { AddressLike, Wallet, ethers } from "ethers";
import { Spinner } from "../utils/spinner";

task("test-verifree-subnet-control", "Decode message and Allow access to given address on subnet")
    .setAction(async (taskArgs, hre) => {
        // Deploy VeriFree control contract
        const privateKey = getPrivateKey();
        const rpcProviderUrl = getProviderRpcUrl(hre.network.name);

        const provider = new ethers.JsonRpcProvider(rpcProviderUrl);
        const wallet = new Wallet(privateKey);
        const deployer = wallet.connect(provider);

        const spinner = new Spinner();

        spinner.start();

        const cChainOriginId = ethers.encodeBytes32String("1111111111111111111111111LpoYY");
        console.log(`ℹ️  cChainOriginId in bytes32: ${cChainOriginId}`);
        console.log(`ℹ️  cChainOriginId decoded: ${ethers.decodeBytes32String(cChainOriginId)}`);

        const verifreeControlAddress = "0x7dbe168bbd6e29750134226d97bfcbc01748a733";

        const addressToUpdate: AddressLike = "0x3F0b704452863C3d1FbAE6B1F0b187C8f12eAcDd"
        const transactionsAllowed = false;
        const transactionsAdmin = false;
        const contractsAllowed = false;
        const contractsAdmin = false;
        const mintSubnetVSBT = true;

        const accessInfo = {
            addressToUpdate,
            transactionsAllowed,
            transactionsAdmin,
            contractsAllowed,
            contractsAdmin,
            mintSubnetVSBT
        }

        const abiCoder = new ethers.AbiCoder();
        const accessInfoEncoded = abiCoder.encode(["address", "bool", "bool", "bool", "bool", "bool"], [addressToUpdate, transactionsAllowed, transactionsAdmin, contractsAllowed, contractsAdmin, mintSubnetVSBT]);

        const veriFreeSubnetControlAddress = "0xbFbeA0E7E91b3a15293E7ac4721E0C5474937def"
        const veriFreeSubnetControl = await hre.ethers.getContractAt("VeriFreeSubnetControl", veriFreeSubnetControlAddress);

        console.log(`ℹ️  Attempting to add update permissions for ${addressToUpdate} on VeriFreeSubnetControl contract ${veriFreeSubnetControl.target} on the ${hre.network.name} blockchain`);
        const requestTx = await veriFreeSubnetControl.receiveTeleporterMessage(cChainOriginId, verifreeControlAddress, accessInfoEncoded);

        spinner.stop();
        console.log(`✅ Address ${addressToUpdate} updated successfully!`);
        console.log(`ℹ Transaction hash: ${requestTx.hash}`);
        // Test adding a domain
        const txReceipt = await requestTx.wait(1);

        console.log(JSON.stringify(txReceipt));

    });

export default {};
