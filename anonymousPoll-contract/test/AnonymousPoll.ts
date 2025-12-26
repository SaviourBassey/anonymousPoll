
import { FhevmType } from "@fhevm/hardhat-plugin";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

describe("AnonymousPoll", function () {
    before(async function () {
        await fhevm.initializeCLIApi();

        [this.deployer, this.acc1, this.acc2, this.acc3] = await ethers.getSigners();
        this.Factory = await ethers.getContractFactory("AnonymousPoll");
        this.deployed = await this.Factory.deploy();
        await this.deployed.waitForDeployment();
        this.contract = this.deployed;
       
   });

   it("should return correct addresses", async function () {
    const ca = await this.contract.getAddress();
    console.log("Contract Address: ", ca);
    expect(ca).to.be.properAddress;
   })


  it("should create poll", async function () {

    const tx = await this.contract.connect(this.acc1).createPoll("Have you ever owned a car.");
    await tx.wait();
    
    const poll = await this.contract.polls(0); 
    // //totalVotes
    expect(poll[3]).to.be.equals(0);

  });

  it("should vote", async function () {

    const encrypted = await fhevm.createEncryptedInput(await this.contract.getAddress(), this.acc1.address)
    .add64(0n)
    .encrypt();
    const tx = await this.contract.connect(this.acc1).vote(0, encrypted.handles[0], encrypted.inputProof);
    await tx.wait();

    const poll = await this.contract.polls(0); 
    // //totalVotes
    expect(poll[3]).to.be.equals(1);

    const myVote = await this.contract.connect(this.acc1).myVote(0);
    const clearVote = await fhevm.userDecryptEuint(FhevmType.euint64, myVote, await this.contract.getAddress(), this.acc1);
    expect(clearVote).to.be.equals(0n);



    const acc2Input = await fhevm
      .createEncryptedInput(await this.contract.getAddress(), this.acc2.address)
      .add64(1n)
      .encrypt();
    const tx2 = await this.contract.connect(this.acc2).vote(0, acc2Input.handles[0], acc2Input.inputProof);
    await tx2.wait();


    const acc2Vote = await this.contract.connect(this.acc2).myVote(0);
    const acc2VoteDecryptedVote = await fhevm.userDecryptEuint(FhevmType.euint64, acc2Vote, await this.contract.getAddress(), this.acc2);
    expect(acc2VoteDecryptedVote).to.be.equals(1n);

    // read yes and no votes
    const p = await this.contract.polls(0);
    const yesV = await fhevm.publicDecrypt([p.numYesVotes])
    const clearYesV = Number(yesV.clearValues[p.numYesVotes]);
    const noV = await fhevm.publicDecrypt([p.numNoVotes])
    const clearNoV = Number(noV.clearValues[p.numNoVotes]);
    console.log({clearYesV, clearNoV});

  });


});


