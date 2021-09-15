async function main () {
    // We get the contract to deploy
    const MOKToken = await ethers.getContractFactory('MOKToken');
    console.log('Deploying Box...');
    const mok = await MOKToken.deploy(10000);
    await mok.deployed();
    console.log('MOK deployed to:', mok.address);

    const Lottery = await ethers.getContractFactory('Lottery');
    console.log('Deploying Box...');
    const lottery = await Lottery.deploy(mok.address);
    await lottery.deployed();
    console.log('Lottery deployed to:', lottery.address);
}
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });