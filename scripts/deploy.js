const { ethers } = require("hardhat");

async function main () {
    // We get the contract to deploy
    const MOKToken = await ethers.getContractFactory('MOKToken');
    console.log('Deploying MOK...');
    const mok = await MOKToken.deploy(ethers.utils.parseEther("100000"));
    await mok.deployed();
    console.log('MOK deployed to:', mok.address);

    const Lottery = await ethers.getContractFactory('Lottery');
    console.log('Deploying Lottery...');
    const lottery = await Lottery.deploy(mok.address, 20, 9500, 500);
    await lottery.deployed();
    console.log('Lottery deployed to:', lottery.address);
}
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });