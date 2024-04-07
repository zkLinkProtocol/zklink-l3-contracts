import { expect } from 'chai';
import * as hre from 'hardhat';
import { ethers, upgrades } from 'hardhat';
import { Signer } from 'ethers';
import { MergeTokenPortal, ERC20MergeToken } from '../typechain';

describe('MergeToeknPortal', function () {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  let mergeTokenPortal: any;
  let erc2OSource0MergenToeken: ERC20MergeToken;
  let owner: Signer;
  let ownerAddr: string;
  let recipient: Signer;
  let recipientAddr: string;
  let commitee: Signer;
  let commiteeAddr: string;
  let user1: Signer;
  let user1Addr: string;
  let user2: Signer;
  let user2Addr: string;
  let user3: Signer;

  beforeEach(async function () {
    [owner, recipient, commitee, user1, user2, user3] = await hre.ethers.getSigners();
    ownerAddr = await owner.getAddress();
    recipientAddr = await recipient.getAddress();
    commiteeAddr = await commitee.getAddress();
    user1Addr = await user1.getAddress();
    user2Addr = await user2.getAddress();

    const MergeTokenPortal = await ethers.getContractFactory('MergeTokenPortal');
    mergeTokenPortal = await upgrades.deployProxy(MergeTokenPortal, [commiteeAddr], {
      kind: 'uups',
      constructorArgs: [],
      unsafeAllow: ['constructor'],
      initializer: 'initialize',
    });
    await mergeTokenPortal.waitForDeployment();
    const ERC20SourceToeknFactory = await ethers.getContractFactory('ERC20MergeToken');
    erc2OSource0MergenToeken = await ERC20SourceToeknFactory.deploy(
      await owner.getAddress(),
      'My Source Token',
      'MTK',
      18,
    );
  });

  describe('Ownership tests', function () {
    let erc20MergeAddr1Token: ERC20MergeToken;
    beforeEach(async function () {
      const ERC20TokenFactory = await ethers.getContractFactory('ERC20MergeToken');
      erc20MergeAddr1Token = await ERC20TokenFactory.deploy(user1Addr, 'user1', 'ADD1TK', 18);
    });

    it('Should set the right owner', async function () {
      expect(await mergeTokenPortal.owner()).to.equal(ownerAddr);
    });

    it('Should not allow non-owner to add source token', async function () {
      await expect(
        (mergeTokenPortal as MergeTokenPortal).connect(recipient).addSourceToken(ownerAddr, recipientAddr, 100),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Should not allow non-owner to remove a source token with balance', async function () {
      await mergeTokenPortal
        .connect(owner)
        .addSourceToken(erc20MergeAddr1Token.target, erc2OSource0MergenToeken.target, 10000);
      await erc20MergeAddr1Token.connect(user3).approve(mergeTokenPortal.target, 500);
      const sourceInfo = await mergeTokenPortal.getSourceTokenInfos(ownerAddr);

      if (sourceInfo.balance > 0) {
        expect(await mergeTokenPortal.removeSourceTkoen(ownerAddr)).to.be.revertedWith(
          'Ownable: caller is not the owner',
        );
      }
    });
  });

  describe('Source Token Management', function () {
    let erc20MergeAddr1Token: ERC20MergeToken;
    let erc20MergeAddr2Token: ERC20MergeToken;
    beforeEach(async function () {
      const ERC20TokenFactory = await ethers.getContractFactory('ERC20MergeToken');
      erc20MergeAddr1Token = await ERC20TokenFactory.deploy(user1Addr, 'user1', 'ADD1TK', 18);
      erc20MergeAddr2Token = await ERC20TokenFactory.deploy(mergeTokenPortal.target, 'user2', 'ADD2TK', 18);
    });
    it('Should add source token correctly', async function () {
      await mergeTokenPortal.connect(owner).addSourceToken(erc20MergeAddr1Token, erc20MergeAddr2Token, 100);
      const sourceTokenInfo = await mergeTokenPortal.connect(owner).getSourceTokenInfos(erc20MergeAddr1Token);
      expect(sourceTokenInfo.isSupported).to.equal(true);
      expect(sourceTokenInfo.isLocked).to.equal(false);
      expect(sourceTokenInfo.mergeToken).to.equal(erc20MergeAddr2Token);
      expect(sourceTokenInfo.balance).to.equal(0n);
      expect(sourceTokenInfo.depositLimit).to.equal(100n);
    });

    it('Should add source token correctly2', async function () {
      await mergeTokenPortal.connect(owner).addSourceToken(erc20MergeAddr1Token, erc20MergeAddr2Token, 100);
      await mergeTokenPortal.connect(owner).removeSourceToken(erc20MergeAddr1Token);
      expect(await mergeTokenPortal.isMergeTokenSupported(erc20MergeAddr2Token, erc20MergeAddr1Token)).to.equal(false);

      await mergeTokenPortal.connect(owner).addSourceToken(erc20MergeAddr1Token, erc20MergeAddr2Token, 1000);
      const sourceTokenInfo = await mergeTokenPortal.connect(owner).getSourceTokenInfos(erc20MergeAddr1Token);
      expect(sourceTokenInfo.isSupported).to.equal(true);
      expect(sourceTokenInfo.isLocked).to.equal(false);
      expect(sourceTokenInfo.mergeToken).to.equal(erc20MergeAddr2Token);
      expect(sourceTokenInfo.balance).to.equal(0n);
      expect(sourceTokenInfo.depositLimit).to.equal(1000n);
    });

    it('Should bot add source token if Invalid token address', async function () {
      await expect(
        mergeTokenPortal
          .connect(owner)
          .addSourceToken('0x0000000000000000000000000000000000000000', recipientAddr, 100),
      ).to.be.revertedWith('Invalid token address');
    });

    it('Should allow owner remove a source token', async function () {
      await mergeTokenPortal.connect(owner).addSourceToken(erc20MergeAddr1Token, erc20MergeAddr2Token, 100);
      let sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token);
      expect(sourceTokenInfo.isSupported).to.equal(true);
      expect(sourceTokenInfo.isLocked).to.equal(false);
      expect(sourceTokenInfo.balance).to.equal(0n);
      expect(sourceTokenInfo.depositLimit).to.equal(100n);
      expect(sourceTokenInfo.mergeToken).to.equal(erc20MergeAddr2Token);
      expect(await mergeTokenPortal.isMergeTokenSupported(erc20MergeAddr2Token, erc20MergeAddr1Token)).to.equal(true);

      await mergeTokenPortal.connect(owner).removeSourceToken(erc20MergeAddr1Token);
      sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token);
      expect(sourceTokenInfo.isSupported).to.equal(false);
      expect(sourceTokenInfo.isLocked).to.equal(false);
      expect(sourceTokenInfo.balance).to.equal(0n);
      expect(sourceTokenInfo.depositLimit).to.equal(0n);
      expect(sourceTokenInfo.mergeToken).to.equal(ZERO_ADDRESS);
      expect(await mergeTokenPortal.isMergeTokenSupported(erc20MergeAddr2Token, erc20MergeAddr1Token)).to.equal(false);
    });

    it('Should allow commitee remove a source token2', async function () {
      await mergeTokenPortal.connect(owner).addSourceToken(erc20MergeAddr1Token, erc20MergeAddr2Token, 100);
      await mergeTokenPortal.connect(commitee).removeSourceToken(erc20MergeAddr1Token);

      const sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token);
      expect(sourceTokenInfo.isSupported).to.equal(false);
      expect(sourceTokenInfo.isLocked).to.equal(false);
      expect(sourceTokenInfo.balance).to.equal(0n);
      expect(sourceTokenInfo.depositLimit).to.equal(0n);
    });

    it('Should not allow non-owner or non-commitee remove a source token', async function () {
      await mergeTokenPortal.connect(owner).addSourceToken(erc20MergeAddr1Token, erc20MergeAddr2Token, 100);
      await expect(mergeTokenPortal.connect(user1).removeSourceToken(erc20MergeAddr1Token)).to.be.revertedWith(
        'Only owner or commitee can call this function',
      );
    });

    it('Should not remove a source token if Source Token balance is not zero', async function () {
      await mergeTokenPortal
        .connect(owner)
        .addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
      await erc20MergeAddr1Token.connect(user2).approve(mergeTokenPortal.target, 1000);
      await erc20MergeAddr1Token.connect(user1).approve(mergeTokenPortal.target, 1000);
      await erc20MergeAddr1Token.connect(user1).mint(user2Addr, 100);
      await erc20MergeAddr1Token.connect(user1).mint(user1Addr, 100);
      await mergeTokenPortal.connect(user1).deposit(erc20MergeAddr1Token.target, 10, user1Addr);
      const balance = await erc20MergeAddr1Token.connect(user1).balanceOf(user1);
      expect(balance).to.equal(90n);
      await expect(mergeTokenPortal.connect(owner).removeSourceToken(erc20MergeAddr1Token.target)).to.be.revertedWith(
        'Source Token balance is not zero',
      );
    });

    it('Should allow owner grant the security council role', async function () {
      const oldCommitee = await mergeTokenPortal.securityCouncil();
      expect(oldCommitee).to.equal(commiteeAddr);
      await mergeTokenPortal.connect(owner).grantSecurityCouncilRole(user1Addr);
      expect(await mergeTokenPortal.securityCouncil()).to.equal(user1Addr);
    });

    it('Should not allow non-owner to grant the security council role', async function () {
      await expect(mergeTokenPortal.connect(user1).grantSecurityCouncilRole(user2Addr)).to.be.revertedWith(
        'Ownable: caller is not the owner',
      );
    });

    it('Should not allow grant the security council role to zero address', async function () {
      await expect(mergeTokenPortal.connect(owner).grantSecurityCouncilRole(ZERO_ADDRESS)).to.be.revertedWith(
        'Invalid the security council role address',
      );
    });

    it('Should not allow grant the security council role to old one', async function () {
      await expect(mergeTokenPortal.connect(owner).grantSecurityCouncilRole(commiteeAddr)).to.be.revertedWith(
        'The Security Council role address is the same as old one',
      );
    });
  });

  describe('Minting and Burning Tests', function () {
    it('Should mint tokens onlyPortal', async function () {
      await expect(erc2OSource0MergenToeken.connect(recipient).mint(recipientAddr, 100)).to.be.revertedWith(
        'Not portal',
      );
    });

    it('Should burn tokens onlyPortal', async function () {
      await expect(erc2OSource0MergenToeken.connect(recipient).burn(recipientAddr, 100)).to.be.revertedWith(
        'Not portal',
      );
    });

    it('Should mint tokens correctly', async function () {
      await erc2OSource0MergenToeken.connect(owner).mint(recipientAddr, 100);
      await erc2OSource0MergenToeken.connect(owner).burn(recipientAddr, 10);
      await expect(await erc2OSource0MergenToeken.balanceOf(recipientAddr)).to.equal(90n);
    });

    it('Should burn tokens correctly', async function () {
      await erc2OSource0MergenToeken.connect(owner).mint(recipientAddr, 200);
      await erc2OSource0MergenToeken.connect(owner).burn(recipientAddr, 100);
      await expect(await erc2OSource0MergenToeken.balanceOf(recipientAddr)).to.equal(100n);
    });
  });

  describe('Deposit Tests', function () {
    let erc20MergeAddr1Token: ERC20MergeToken;
    let erc20MergeAddr2Token: ERC20MergeToken;
    beforeEach(async function () {
      const ERC20TokenFactory = await ethers.getContractFactory('ERC20MergeToken');
      erc20MergeAddr1Token = await ERC20TokenFactory.deploy(user1Addr, 'user1', 'ADD1TK', 18);
      erc20MergeAddr2Token = await ERC20TokenFactory.deploy(mergeTokenPortal.target, 'user2', 'ADD2TK', 18);
    });

    it('should revert when trying to deposit unsupported token', async () => {
      await expect(
        mergeTokenPortal.connect(user2).deposit(erc20MergeAddr1Token.target, 1000, user1Addr),
      ).to.be.revertedWith('Source token is not supported');
    });

    it('Should disable updateDepositStatus disabledeposit if Source token is not supported', async function () {
      await erc20MergeAddr1Token.connect(user2).approve(mergeTokenPortal.target, 1000);
      await erc20MergeAddr1Token.connect(user1).approve(mergeTokenPortal.target, 1000);
      await erc20MergeAddr1Token.connect(user1).mint(user2Addr, 100);
      await erc20MergeAddr1Token.connect(user1).mint(user1Addr, 100);
      const balance1 = await erc20MergeAddr1Token.connect(user1).balanceOf(user1);
      const balance2 = await erc20MergeAddr1Token.connect(user1).balanceOf(user1);
      expect(balance1).to.equal(100n);
      expect(balance2).to.equal(100n);
      await expect(
        mergeTokenPortal.connect(owner).updateDepositStatus(erc20MergeAddr1Token.target, true),
      ).to.be.revertedWith('Source token is not supported');
      await expect(
        mergeTokenPortal.connect(user1).deposit(erc20MergeAddr1Token.target, 10, user1Addr),
      ).to.be.revertedWith('Source token is not supported');
    });

    it('Should not allow non-owner or non-commitee to update deposit status when token is supported', async function () {
      await mergeTokenPortal
        .connect(owner)
        .addSourceToken(erc20MergeAddr1Token.target, erc2OSource0MergenToeken.target, 10000);
      const sourceInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token.target);
      if (sourceInfo.isSupported) {
        await expect(
          mergeTokenPortal.connect(user3).updateDepositStatus(erc20MergeAddr1Token.target, true),
        ).to.be.revertedWith('Only owner or commitee can call this function');
      }
    });

    it('Should allow owner or commitee to update deposit status when token is supported', async function () {
      await mergeTokenPortal
        .connect(owner)
        .addSourceToken(erc20MergeAddr1Token.target, erc2OSource0MergenToeken.target, 10000);
      await mergeTokenPortal.connect(owner).updateDepositStatus(erc20MergeAddr1Token.target, true);
      let sourceInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token.target);
      expect(sourceInfo.isLocked).to.equal(true);

      await mergeTokenPortal.connect(commitee).updateDepositStatus(erc20MergeAddr1Token.target, false);
      sourceInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token.target);
      expect(sourceInfo.isLocked).to.equal(false);
    });

    it('Should not allow non-owner to set deposit limit', async function () {
      const initialAmount = 100;
      await expect(
        mergeTokenPortal.connect(user3).setDepositLimit(erc20MergeAddr1Token.target, initialAmount),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Should set deposit limit correctly by only owner ', async () => {
      const initialAmount = 100;
      await mergeTokenPortal
        .connect(owner)
        .addSourceToken(erc20MergeAddr1Token.target, erc2OSource0MergenToeken.target, 10000);
      await mergeTokenPortal.connect(owner).setDepositLimit(erc20MergeAddr1Token.target, initialAmount);
      const sourceInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token.target);
      expect(sourceInfo.depositLimit).to.equal(initialAmount);
    });

    it('Should deposit correctly', async function () {
      await mergeTokenPortal
        .connect(owner)
        .addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
      await erc20MergeAddr1Token.connect(user2).approve(mergeTokenPortal.target, 1000);
      await erc20MergeAddr1Token.connect(user1).approve(mergeTokenPortal.target, 1000);
      await erc20MergeAddr1Token.connect(user1).mint(user2Addr, 100);
      await erc20MergeAddr1Token.connect(user1).mint(user1Addr, 100);
      await mergeTokenPortal.connect(user1).deposit(erc20MergeAddr1Token.target, 10, user2Addr);
      const sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token.target);
      const balance1 = await erc20MergeAddr1Token.connect(user1).balanceOf(user1);
      const balance2 = await erc20MergeAddr1Token.connect(user1).balanceOf(user2);
      expect(balance1).to.equal(90n);
      expect(balance2).to.equal(100n);
      expect(sourceTokenInfo.balance).to.equal(10n);
    });

    it('Should deposit correctly2', async function () {
      await mergeTokenPortal
        .connect(owner)
        .addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
      await erc20MergeAddr1Token.connect(user2).approve(mergeTokenPortal.target, 10000);
      await erc20MergeAddr1Token.connect(user1).mint(user2Addr, 10000);
      const balance11 = await erc20MergeAddr1Token.connect(user1).balanceOf(user1);
      const balance22 = await erc20MergeAddr1Token.connect(user1).balanceOf(user2);
      const balance33 = await erc20MergeAddr2Token.connect(user1).balanceOf(user2);
      const balance44 = await erc20MergeAddr2Token.connect(user1).balanceOf(user1);
      await mergeTokenPortal.connect(user2).deposit(erc20MergeAddr1Token.target, 1000, user1Addr);
      await mergeTokenPortal.connect(user1).withdraw(erc20MergeAddr1Token.target, 500, user2Addr);
      await mergeTokenPortal.connect(user2).deposit(erc20MergeAddr1Token.target, 1000, user1Addr);
      const sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token.target);
      const balance1 = await erc20MergeAddr1Token.connect(user1).balanceOf(user1);
      const balance2 = await erc20MergeAddr1Token.connect(user1).balanceOf(user2);
      const balance3 = await erc20MergeAddr2Token.connect(user1).balanceOf(user2);
      const balance4 = await erc20MergeAddr2Token.connect(user1).balanceOf(user1);
      expect(balance1).to.equal(0n);
      expect(balance2).to.equal(8500n);
      expect(balance3).to.equal(0n);
      expect(balance4).to.equal(1500n);
      expect(balance11).to.equal(0n);
      expect(balance22).to.equal(10000n);
      expect(balance33).to.equal(0n);
      expect(balance44).to.equal(0n);
      expect(sourceTokenInfo.balance).to.equal(1500n);
    });

    it('Should not deposit if Source token is not supported', async function () {
      await erc20MergeAddr1Token.connect(user2).approve(mergeTokenPortal.target, 1000);
      await erc20MergeAddr1Token.connect(user1).approve(mergeTokenPortal.target, 1000);
      const balance11 = await erc20MergeAddr1Token.connect(user1).balanceOf(user1);
      const balance22 = await erc20MergeAddr1Token.connect(user1).balanceOf(user2);
      await erc20MergeAddr1Token.connect(user1).mint(user2Addr, 100);
      await erc20MergeAddr1Token.connect(user1).mint(user1Addr, 100);
      const balance1 = await erc20MergeAddr1Token.connect(user1).balanceOf(user1);
      const balance2 = await erc20MergeAddr1Token.connect(user1).balanceOf(user2);
      const balance3 = await erc20MergeAddr2Token.connect(user1).balanceOf(user2);
      const balance4 = await erc20MergeAddr2Token.connect(user1).balanceOf(user1);
      expect(balance1).to.equal(100n);
      expect(balance2).to.equal(100n);
      expect(balance3).to.equal(0n);
      expect(balance4).to.equal(0n);
      expect(balance11).to.equal(0n);
      expect(balance22).to.equal(0n);
      await expect(
        mergeTokenPortal.connect(owner).deposit(erc20MergeAddr1Token.target, 10, user1Addr),
      ).to.be.revertedWith('Source token is not supported');
    });

    it('Should disabledeposit amount is zero', async function () {
      await mergeTokenPortal
        .connect(owner)
        .addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
      await erc20MergeAddr1Token.connect(user2).approve(mergeTokenPortal.target, 1000);
      await erc20MergeAddr1Token.connect(user1).approve(mergeTokenPortal.target, 1000);
      await erc20MergeAddr1Token.connect(user1).mint(user2Addr, 100);
      await erc20MergeAddr1Token.connect(user1).mint(user1Addr, 100);
      const balance1 = await erc20MergeAddr1Token.connect(user1).balanceOf(user1);
      const balance2 = await erc20MergeAddr1Token.connect(user1).balanceOf(user2);
      expect(balance1).to.equal(100n);
      expect(balance2).to.equal(100n);
      await expect(
        mergeTokenPortal.connect(user1).deposit(erc20MergeAddr1Token.target, 0, user1Addr),
      ).to.be.revertedWith('Deposit amount is zero');
    });

    it('Should disable deposit correctly', async function () {
      await mergeTokenPortal
        .connect(owner)
        .addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
      await mergeTokenPortal.connect(owner).updateDepositStatus(erc20MergeAddr1Token.target, true);
      const sourceInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token.target);
      expect(sourceInfo.isLocked).to.equal(true);
    });

    it('Should not allow deposit if disabled', async function () {
      await mergeTokenPortal
        .connect(owner)
        .addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
      await mergeTokenPortal.connect(owner).updateDepositStatus(erc20MergeAddr1Token.target, true);
      await erc20MergeAddr1Token.connect(user1).mint(user1Addr, 10000);
      const balance1 = await erc20MergeAddr1Token.connect(user1).balanceOf(user1);
      expect(balance1).to.equal(10000n);
      await expect(
        mergeTokenPortal.connect(user1).deposit(erc20MergeAddr1Token.target, 1000, ownerAddr),
      ).to.be.revertedWith('Source token is locked');
    });

    it('Should set deposit limit correctly', async function () {
      await mergeTokenPortal
        .connect(owner)
        .addSourceToken(erc20MergeAddr1Token.target, erc2OSource0MergenToeken.target, 10000);
      await erc20MergeAddr1Token.connect(owner).approve(mergeTokenPortal.target, 1000);
      await erc20MergeAddr1Token.connect(user1).mint(ownerAddr, 10000);
      await mergeTokenPortal.connect(owner).setDepositLimit(erc20MergeAddr1Token.target, 500);
      const sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token.target);
      const balance1 = await erc20MergeAddr1Token.connect(user1).balanceOf(ownerAddr);
      expect(balance1).to.equal(10000n);
      expect(sourceTokenInfo.depositLimit).to.equal(500);
    });

    it('Should not allow deposit over the limit', async function () {
      await mergeTokenPortal
        .connect(owner)
        .addSourceToken(erc20MergeAddr1Token.target, erc2OSource0MergenToeken.target, 10000);
      await erc20MergeAddr1Token.connect(owner).approve(mergeTokenPortal.target, 1000);
      await erc20MergeAddr1Token.connect(user1).mint(ownerAddr, 10000);
      await mergeTokenPortal.connect(owner).setDepositLimit(erc20MergeAddr1Token.target, 500);
      await expect(mergeTokenPortal.connect(owner).deposit(erc20MergeAddr1Token, 1000, ownerAddr)).to.be.revertedWith(
        'Source token deposit limit exceeded',
      );
    });
  });

  describe('Withdrawal Tests ', function () {
    let erc20MergeAddr1Token: ERC20MergeToken;
    let erc20MergeAddr2Token: ERC20MergeToken;
    beforeEach(async function () {
      const ERC20TokenFactory = await ethers.getContractFactory('ERC20MergeToken');
      erc20MergeAddr1Token = await ERC20TokenFactory.deploy(user1Addr, 'user1', 'ADD1TK', 18);
      erc20MergeAddr2Token = await ERC20TokenFactory.deploy(mergeTokenPortal.target, 'user2', 'ADD2TK', 18);
    });
    it('should revert when trying to deposit zero amount', async () => {
      await expect(
        mergeTokenPortal.connect(user2).deposit(erc20MergeAddr1Token.target, 0, user1Addr),
      ).to.be.revertedWith('Deposit amount is zero');
    });

    it('Should allow withdrawal correctly', async function () {
      await mergeTokenPortal
        .connect(owner)
        .addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
      await erc20MergeAddr1Token.connect(user2).approve(mergeTokenPortal.target, 1000);
      await erc20MergeAddr1Token.connect(user1).mint(user2Addr, 10000);
      await mergeTokenPortal.connect(user2).deposit(erc20MergeAddr1Token.target, 1000, user1Addr);
      await mergeTokenPortal.connect(user1).withdraw(erc20MergeAddr1Token.target, 500, user2Addr);
      const sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token.target);
      const balance1 = await erc20MergeAddr1Token.connect(user1).balanceOf(user1);
      const balance2 = await erc20MergeAddr1Token.connect(user1).balanceOf(user2);
      expect(balance1).to.equal(0n);
      expect(balance2).to.equal(9500n);
      expect(sourceTokenInfo.balance).to.equal(500);
    });

    it('Should allow withdrawal correctly2', async function () {
      await mergeTokenPortal
        .connect(owner)
        .addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
      await erc20MergeAddr1Token.connect(user2).approve(mergeTokenPortal.target, 10000);
      await erc20MergeAddr1Token.connect(user1).mint(user2Addr, 10000);
      const balance11 = await erc20MergeAddr1Token.connect(user1).balanceOf(user1);
      const balance22 = await erc20MergeAddr1Token.connect(user1).balanceOf(user2);
      const balance33 = await erc20MergeAddr2Token.connect(user1).balanceOf(user1);
      const balance44 = await erc20MergeAddr2Token.connect(user1).balanceOf(user2);
      await mergeTokenPortal.connect(user2).deposit(erc20MergeAddr1Token.target, 1000, user1Addr);
      await mergeTokenPortal.connect(user1).withdraw(erc20MergeAddr1Token.target, 500, user2Addr);
      await mergeTokenPortal.connect(user2).deposit(erc20MergeAddr1Token.target, 1000, user1Addr);
      await mergeTokenPortal.connect(user1).withdraw(erc20MergeAddr1Token.target, 500, user2Addr);
      const sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token.target);
      const balance1 = await erc20MergeAddr1Token.connect(user1).balanceOf(user1);
      const balance2 = await erc20MergeAddr1Token.connect(user1).balanceOf(user2);
      const balance3 = await erc20MergeAddr2Token.connect(user1).balanceOf(user1);
      const balance4 = await erc20MergeAddr2Token.connect(user1).balanceOf(user2);
      expect(balance1).to.equal(0n);
      expect(balance2).to.equal(9000n);
      expect(balance3).to.equal(1000n);
      expect(balance4).to.equal(0n);
      expect(balance11).to.equal(0n);
      expect(balance22).to.equal(10000n);
      expect(balance33).to.equal(0n);
      expect(balance44).to.equal(0n);
      expect(sourceTokenInfo.balance).to.equal(1000);
    });

    it('Should not allow withdrawal if Source Token balance is not enough', async function () {
      await mergeTokenPortal
        .connect(owner)
        .addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
      await erc20MergeAddr1Token.connect(user2).approve(mergeTokenPortal.target, 1000);
      await erc20MergeAddr1Token.connect(user1).mint(user2Addr, 10000);
      await mergeTokenPortal.connect(user2).deposit(erc20MergeAddr1Token.target, 1000, user1Addr);
      expect(
        mergeTokenPortal.connect(user1).withdraw(erc20MergeAddr1Token.target, 50000, user2Addr),
      ).to.be.revertedWith('Source Token balance is not enough');
    });

    it('Should not allow withdrawal more than deposit', async function () {
      await mergeTokenPortal
        .connect(owner)
        .addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
      await erc20MergeAddr1Token.connect(user2).approve(mergeTokenPortal.target, 1000);
      await erc20MergeAddr1Token.connect(user1).mint(user2Addr, 10000);
      await mergeTokenPortal.connect(user2).deposit(erc20MergeAddr1Token.target, 1000, user1Addr);
      await expect(
        mergeTokenPortal.connect(recipient).withdraw(erc20MergeAddr1Token.target, 1500, ownerAddr),
      ).to.be.revertedWith('Source Token balance is not enough');
    });

    it('Should not allow withdrawal if Withdraw amount is zero', async function () {
      await mergeTokenPortal
        .connect(owner)
        .addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
      await erc20MergeAddr1Token.connect(user2).approve(mergeTokenPortal.target, 1000);
      await erc20MergeAddr1Token.connect(user1).mint(user2Addr, 10000);
      await mergeTokenPortal.connect(user2).deposit(erc20MergeAddr1Token.target, 1000, user1Addr);
      expect(
        mergeTokenPortal.connect(recipient).withdraw(erc20MergeAddr1Token.target, 0, ownerAddr),
      ).to.be.revertedWith('Withdraw amount is zero');
    });
  });
});
