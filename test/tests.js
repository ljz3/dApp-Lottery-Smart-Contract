const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Testing MOK", function () {
  it("Deployment should assign the total supply of tokens to the owner", async function () {
    const accounts = await ethers.getSigners();
    const owner = accounts[0];

    const MOK = await ethers.getContractFactory("MOKToken");

    const MOKToken = await MOK.deploy(ethers.utils.parseEther("100000"));

    const ownerBalance = await MOKToken.balanceOf(owner.address);
    expect(await MOKToken.totalSupply()).to.equal(ownerBalance);
  });
});




describe("Testing Lottery Contract Deployent", function () {
  it("Testing Lottery Contract Deployent", async function () {
    const MOKToken = await ethers.getContractFactory("MOKToken");
    const MOK = await MOKToken.deploy(ethers.utils.parseEther("100000"));

    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy(MOK.address, 20, 9500, 500);
    await lottery.deployed();
    expect(await lottery.address).to.not.be.null;
  });

  it("Testing Lottery Contract Deployent with bad constructors", async function () {
    const MOKToken = await ethers.getContractFactory("MOKToken");
    const MOK = await MOKToken.deploy(ethers.utils.parseEther("100000"));

    const Lottery = await ethers.getContractFactory("Lottery");
    await expect(Lottery.deploy(MOK.address, 20, 9500, 5000)).to.be.revertedWith("reverted with reason string 'Incorrect basis points!'");
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
    lottery = await Lottery.deploy(MOK.address, 20, 9500, 500);

    await MOK.connect(owner);
    await MOK.transfer(accounts[1].address, ethers.utils.parseEther("100"));
    await MOK.transfer(accounts[2].address, ethers.utils.parseEther("100"));
  });

  describe("Testing Manager Functions", function () {
    it("Testing adding first manager", async function () {
      await lottery.addManager(accounts[1].address);
      expect(await lottery.hasRole(await lottery.MANAGER(), accounts[1].address)).to.be.true;
    });

    it("Testing adding second manager", async function () {
      await lottery.addManager(accounts[1].address);
      await lottery.addManager(accounts[2].address);
      expect(await lottery.hasRole(await lottery.MANAGER(), accounts[1].address)).to.be.true;
      expect(await lottery.hasRole(await lottery.MANAGER(), accounts[2].address)).to.be.true;
    });

    it("Testing adding third manager", async function () {
      await lottery.addManager(accounts[1].address);
      await lottery.addManager(accounts[2].address);
      await expect(lottery.addManager(accounts[3].address)).to.be.revertedWith("reverted with reason string 'Too many managers!'");
    });

    it("Testing removing one manager", async function () {
      await lottery.addManager(accounts[1].address);
      await lottery.removeManager(accounts[1].address);
      expect(await lottery.hasRole(await lottery.MANAGER(), accounts[1].address)).to.be.false;
    });

    it("Testing removing two managers", async function () {
      await lottery.addManager(accounts[1].address);
      await lottery.addManager(accounts[2].address);
      await lottery.removeManager(accounts[1].address);
      await lottery.removeManager(accounts[2].address);
      expect(await lottery.hasRole(await lottery.MANAGER(), accounts[1].address)).to.be.false;
      expect(await lottery.hasRole(await lottery.MANAGER(), accounts[2].address)).to.be.false;
    });

    it("Testing removing someone who is not manager", async function () {
      await expect(lottery.removeManager(accounts[1].address)).to.be.revertedWith("reverted with reason string 'User is not a manager!'");
    });

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
      await expect(lottery.connect(accounts[4]).enter()).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Testing funds not approved", async function () {
      await expect(lottery.connect(accounts[1]).enter()).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
    });

    it("Testing multiple people entry 1 person no funds", async function () {
      await MOK.connect(accounts[1]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[1]).enter();
      await MOK.connect(accounts[4]).approve(lottery.address, ethers.utils.parseEther("20"));

      expect(await lottery.players(0)).to.equal(accounts[1].address);
      await expect(lottery.connect(accounts[4]).enter()).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Testing multiple people entry 1 person no approval", async function () {
      await MOK.connect(accounts[1]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[1]).enter();

      expect(await lottery.players(0)).to.equal(accounts[1].address);
      await expect(lottery.connect(accounts[2]).enter()).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
    });
  });




  describe("Testing Lottery Picking Winner", function () {

    it("Testing no players to pick from", async function () {
      await expect(lottery.pickWinner()).to.be.revertedWith("reverted with panic code 0x12 (Division or modulo division by zero)");
    });

    it("Testing not owner picking winner", async function () {
      await expect(lottery.connect(accounts[1]).pickWinner()).to.be.revertedWith("reverted with reason string 'Caller does not have permission to do this!'");
    });

    it("Testing 1 player to pick from", async function () {
      await MOK.connect(accounts[1]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[1]).enter();
      await lottery.pickWinner();
      expect(await lottery.winner()).to.equal(accounts[1].address);
    });

    it("Testing picking 2 winners, on cooldown", async function () {
      await MOK.connect(accounts[1]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[1]).enter();
      await lottery.pickWinner();
      await expect(lottery.pickWinner()).to.be.revertedWith("reverted with reason string 'This function is on cooldown!'");
    });

    it("Testing picking 2 winners, multiple players, on cooldown", async function () {
      await MOK.connect(accounts[1]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[1]).enter();
      await MOK.connect(accounts[2]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[2]).enter();
      await lottery.pickWinner();
      await expect(lottery.pickWinner()).to.be.revertedWith("reverted with reason string 'This function is on cooldown!'");
    });

    it("Testing picking 2 winners, multiple players, off cooldown", async function () {
      await MOK.connect(accounts[1]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[1]).enter();
      await MOK.connect(accounts[2]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[2]).enter();
      await lottery.pickWinner();
      await network.provider.send("evm_increaseTime", [3600]);
      expect(await lottery.winner()).to.satisfy(function(address) { 
        return (address === accounts[1].address || address === accounts[2].address); 
      });
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

    it("Testing not owner or manager, and multiple players to pick from", async function () {
      await MOK.connect(accounts[1]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[1]).enter();
      await MOK.connect(accounts[2]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[2]).enter();
      await expect(lottery.connect(accounts[2]).pickWinner()).to.be.revertedWith("reverted with reason string 'Caller does not have permission to do this!'");
    });

    it("Testing manager and 1 player to pick from", async function () {
      await lottery.addManager(accounts[3].address);
      await MOK.connect(accounts[1]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[1]).enter();
      await lottery.connect(accounts[3]).pickWinner();
      expect(await lottery.winner()).to.equal(accounts[1].address);
    });

    it("Testing manager and multiple players to pick from", async function () {
      await lottery.addManager(accounts[3].address);
      await MOK.connect(accounts[1]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[1]).enter();
      await MOK.connect(accounts[2]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[2]).enter();
      await lottery.connect(accounts[3]).pickWinner();
      expect(await lottery.winner()).to.satisfy(function(address) { 
        return (address === accounts[1].address || address === accounts[2].address); 
      });
    });
  });




  describe("Testing Lottery Payout", function () {

    it("Testing no MOK tokens to payout", async function () {
      await expect(lottery.payout()).to.be.revertedWith("reverted with reason string 'ERC20: transfer to the zero address'");
    });

    it("Testing payout to winner", async function () {
      await MOK.connect(accounts[1]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[1]).enter();
      let balance = await MOK.balanceOf(accounts[1].address);
      await lottery.pickWinner();
      await lottery.payout();
      expect(parseInt((await MOK.balanceOf(accounts[1].address))._hex, 16)).to.equal(parseInt(balance) + parseInt(ethers.utils.parseEther("19")));
    });

    it("Testing not owner paying out", async function () {
      await MOK.connect(accounts[1]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[1]).enter();
      let balance = await MOK.balanceOf(accounts[1].address);
      await lottery.pickWinner();
      await expect(lottery.connect(accounts[1]).pickWinner()).to.be.revertedWith("reverted with reason string 'Caller does not have permission to do this!'");
    });
  });




  describe("Testing Withdrawing Entry Fees", function () {

    it("Testing no MOK tokens to withdraw", async function () {
      let balance = await MOK.balanceOf(accounts[0].address);
      lottery.withdraw();
      expect(await MOK.balanceOf(accounts[0].address)).to.equal(balance);
    });

    it("Testing withdraw fees to owner", async function () {
      await MOK.connect(accounts[1]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[1]).enter();
      let balance = await MOK.balanceOf(accounts[0].address);
      expect(await lottery.withdraw()).to.satisfy(function() { 
        let newbal = MOK.balanceOf(accounts[0].address);
        return (newbal > balance);
      });
    });

    it("Testing not owner withdrawing", async function () {
      await MOK.connect(accounts[1]).approve(lottery.address, ethers.utils.parseEther("20"));
      await lottery.connect(accounts[1]).enter();
      await expect(lottery.connect(accounts[1]).withdraw()).to.be.revertedWith("Caller is not the OWNER");
    });
  });


  describe("Testing Changing Entry Fees", function () {
    it("Testing not owner changing fees", async function () {
      await expect(lottery.connect(accounts[1]).changeEntry(100, 5000, 5000)).to.be.revertedWith("Caller is not the OWNER");
    });

    it("Testing owner changing fees", async function () {
      await lottery.changeEntry(100, 6000, 4000);
      expect(await lottery.entryFee()).to.equal(100);
      expect(await lottery.poolContributionBasis()).to.equal(6000);
      expect(await lottery.ownerFeeBasis()).to.equal(4000);
    });

    it("Testing owner changing fees to too many basis points", async function () {
      await expect(lottery.changeEntry(100, 10000, 5000)).to.be.revertedWith("reverted with reason string 'Basis points do not add up to 10000'");
    });

    it("Testing owner changing fees to too little basis points", async function () {
      await expect(lottery.changeEntry(100, 500, 5000)).to.be.revertedWith("reverted with reason string 'Basis points do not add up to 10000'");
    });
  });
});
