import { ethers, network } from 'hardhat';
import { expect } from 'chai';
import { getPrivateKey, getProviderRpcUrl } from '../tasks/utils';
import { Wallet } from 'ethers';

describe('VerifreeControl', async () => {
  it('should be able to set new allowed admin', async () => {
    const privateKey = getPrivateKey();
    // Get hardhat runtime environment

    // const rpcProviderUrl = getProviderRpcUrl(network.name);

    // const provider = new ethers.JsonRpcProvider(rpcProviderUrl);
    // const wallet = new Wallet(privateKey);
    // const deployer = wallet.connect(provider);
    const newAllowListAdmin = "0x8c07411ca94bE4a1804215004a2e7d05AC2712c5";
    const veriFreeControl = await ethers.getContractAt("VeriFreeControl", "0x32C79622f1119D199Aa5Bd7574b3DaE461591a58");
    const account = await ethers.getSigners();
    console.log(`ℹ️  Attempting to add address ${newAllowListAdmin} to VeriFreeControl contract ${veriFreeControl.target} adminAllowlist on the ${network.name} blockchain`);
    // Expect to not revert 
    console.log(`Account: ${account[0].address}`)
    await expect(veriFreeControl.updateAllowListedAdmins(newAllowListAdmin, true)).to.not.be.reverted;
  });

  it('should not revert when calling addValidDomains', async () => {
    const privateKey = getPrivateKey();
    // Get hardhat runtime environment

    // const rpcProviderUrl = getProviderRpcUrl(network.name);

    // const provider = new ethers.JsonRpcProvider(rpcProviderUrl);
    // const wallet = new Wallet(privateKey);
    // const deployer = wallet.connect(provider);
    const domainToAdd = "uta.edu";
    const veriFreeControl = await ethers.getContractAt("VeriFreeControl", "0x32C79622f1119D199Aa5Bd7574b3DaE461591a58");
    console.log(`ℹ️  Attempting to add domain ${domainToAdd} to VeriFreeControl contract ${veriFreeControl.target} on the ${network.name} blockchain`);
    // Expect to revert with error message
    await expect(veriFreeControl.addValidDomains(domainToAdd)).to.be.rejectedWith('AddressNotAuthorized');
  });
});