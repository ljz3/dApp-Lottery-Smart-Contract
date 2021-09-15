const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Testing MOK", function () {
  it("Deployment should assign the total supply of tokens to the owner", async function () {
    const accounts = await ethers.getSigners();
    const owner = accounts[0];

    const MOK = await ethers.getContractFactory("MOKToken");

    const MOKToken = await MOK.deploy(10000);

    const ownerBalance = await MOKToken.balanceOf(owner.address);
    expect(await MOKToken.totalSupply()).to.equal(ownerBalance);
  });
});

describe("Testing Lottery Contract Deployent", function () {
  it("Testing Lottery Contract Deployent", async function () {
    const MOKToken = await ethers.getContractFactory("MOKToken");
    const MOK = await MOKToken.deploy(10000);

    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy(MOK.address);
    await lottery.deployed();
    expect(await lottery.address).to.not.be.null;
  });
});

describe("Testing Lottery", function () {
  let MOK;
  let MOKToken;
  let Lottery;
  let lottery;
  let owner;
  let accounts;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    owner = accounts[0];

    MOKToken = await ethers.getContractFactory("MOKToken");
    MOK = await MOKToken.deploy(ethers.utils.parseEther("100000"));

    Lottery = await ethers.getContractFactory("Lottery");
    lottery = await Lottery.deploy(MOK.address);

    await MOK.connect(owner);
    await MOK.transfer(accounts[1].address, ethers.utils.parseEther("100"));
    await MOK.transfer(accounts[2].address, ethers.utils.parseEther("100"));
  });

  
  describe("Testing Lottery Entering", function () {

    it("Testing 1 person entry", async function () {
      await MOK.connect(accounts[1]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[1]).enter();
      expect(await lottery.players(0)).to.equal(accounts[1].address);
    });

    it("Testing multiple people entry", async function () {
      await MOK.connect(accounts[1]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[1]).enter();
      await MOK.connect(accounts[2]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[2]).enter();

      expect(await lottery.players(0)).to.equal(accounts[1].address);
      expect(await lottery.players(1)).to.equal(accounts[2].address);
    });

    it("Testing insufficient funds", async function () {
      await MOK.connect(accounts[4]).approve(lottery.address, ethers.utils.parseEther("20"));
      await expect(lottery.connect(accounts[4]).enter()).to.be.reverted;
    });

    it("Testing funds not approved", async function () {
      await expect(lottery.connect(accounts[1]).enter()).to.be.reverted;
    });

    it("Testing multiple people entry 1 person no funds", async function () {
      await MOK.connect(accounts[1]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[1]).enter();
      await MOK.connect(accounts[4]).approve(lottery.address, ethers.utils.parseEther("20"));

      expect(await lottery.players(0)).to.equal(accounts[1].address);
      await expect(lottery.connect(accounts[4]).enter()).to.be.reverted;
    });


    it("Testing multiple people entry 1 person no approval", async function () {
      await MOK.connect(accounts[1]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[1]).enter();

      expect(await lottery.players(0)).to.equal(accounts[1].address);
      await expect(lottery.connect(accounts[2]).enter()).to.be.reverted;
    });


  });


  describe("Testing Lottery Picking Winner", function () {

    it("Testing no players to pick from", async function () {
      await expect(lottery.pickWinner()).to.be.reverted;
    });

    it("Testing not owner picking winner", async function () {
      await expect(lottery.connect(accounts[1]).pickWinner()).to.be.reverted;
    });

    it("Testing 1 player to pick from", async function () {
      await MOK.connect(accounts[1]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[1]).enter();
      await lottery.pickWinner();
      expect(await lottery.winner()).to.equal(accounts[1].address);

    });

    it("Testing multiple players to pick from", async function () {
      await MOK.connect(accounts[1]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[1]).enter();
      await MOK.connect(accounts[2]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[2]).enter();
      await lottery.pickWinner();
      expect(await lottery.winner()).to.satisfy(function(address) { 
        return (address === accounts[1].address || address === accounts[2].address); 
      });
    });


  });

  describe("Testing Lottery Payout", function () {

    it("Testing no MOK tokens to payout", async function () {
      await expect(lottery.payout()).to.be.reverted;
    });

    it("Testing payout to winner", async function () {
      await MOK.connect(accounts[1]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[1]).enter();
      let balance = await MOK.balanceOf(accounts[1].address);
      await lottery.pickWinner();
      await lottery.payout();
      expect(parseInt((await MOK.balanceOf(accounts[1].address))._hex, 16)).to.equal(parseInt(balance) + parseInt(ethers.utils.parseEther("19")));
    });

    it("Testing payout to nobody", async function () {
      await expect(lottery.pickWinner()).to.be.reverted;
    });

    it("Testing not owner paying out", async function () {
      await MOK.connect(accounts[1]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[1]).enter();
      let balance = await MOK.balanceOf(accounts[1].address);
      await lottery.pickWinner();
      await expect(lottery.connect(accounts[1]).pickWinner()).to.be.reverted;
    });

  });
});
