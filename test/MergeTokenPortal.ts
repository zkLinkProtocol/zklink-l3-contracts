import { expect, assert } from 'chai';
import { BigNumberish } from 'ethers';
import { ethers } from 'ethers';
import { Contract, Wallet } from "zksync-ethers";
import * as hre from "hardhat";
import { getWallet, deployContract, LOCAL_RICH_WALLETS, getProvider } from '../deploy/utils';    //../../deploy/utils';

describe("MergeToeknPortal", function () {
    let mergeTokenPortal, erc20MergeToken, ownerWallet, recipientWallet, commonWallet, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9;
    beforeEach(async function () {
        ownerWallet = getWallet(LOCAL_RICH_WALLETS[0].privateKey);
        recipientWallet = getWallet(LOCAL_RICH_WALLETS[1].privateKey);
        commonWallet = getWallet(LOCAL_RICH_WALLETS[2].privateKey);
        addr1 = getWallet(LOCAL_RICH_WALLETS[3].privateKey);
        addr2 = getWallet(LOCAL_RICH_WALLETS[4].privateKey);
        addr3 = getWallet(LOCAL_RICH_WALLETS[5].privateKey);
        addr4 = getWallet(LOCAL_RICH_WALLETS[6].privateKey);
        addr5 = getWallet(LOCAL_RICH_WALLETS[7].privateKey);
        addr6 = getWallet(LOCAL_RICH_WALLETS[8].privateKey);
        addr7 = getWallet(LOCAL_RICH_WALLETS[9].privateKey);

        // console.log(ownerWallet.address, recipientWallet.address)
        mergeTokenPortal = await deployContract("MergeTokenPortal", [ownerWallet.address], { wallet: ownerWallet, silent: true, noVerify: true });
        erc20MergeToken = await deployContract("ERC20MergeToken", [ownerWallet.address, "MyToken", "MTK", 18]);

        // console.log(mergeTokenPortal,erc20MergeToken)
    });
    describe("MergeToken", function () {//ethers.parseEther("100")
        it("Should mint tokens correctly", async function () {
            await erc20MergeToken.connect(ownerWallet).mint(recipientWallet.address, 100);
            console.log(await erc20MergeToken.balanceOf(recipientWallet.address), "balance")
            expect(await erc20MergeToken.balanceOf(recipientWallet.address)).to.equal(100n);
        });

        it("Should set the right owner", async function () {
            expect(await mergeTokenPortal.GOVERNANCE()).to.equal(ownerWallet.address);
        });

        it("Should add source token correctly", async function () {
            //await mergeTokenPortal.initialize();
            // 确保上一步已经完成
            await new Promise(resolve => setTimeout(resolve, 100));
            await mergeTokenPortal.connect(ownerWallet).addSourceToken(ownerWallet.address, recipientWallet.address, 100);
            let sourceTokenInfo = await mergeTokenPortal.connect(ownerWallet).getSourceTokenInfos(ownerWallet.address);
            expect(sourceTokenInfo.isSupported).to.equal(true);
            expect(sourceTokenInfo.isLocked).to.equal(false);
            expect(sourceTokenInfo.mergeToken).to.equal(recipientWallet.address);
            expect(sourceTokenInfo.balance).to.equal(0n);
            expect(sourceTokenInfo.depositLimit).to.equal(100n);
        });

        it("Should not allow non-owner to add source token", async function () {
            //const add = await mergeTokenPortal.connect(recipientWallet).addSourceToken(ownerWallet.address, recipientWallet.address,100);
            expect(mergeTokenPortal.connect(recipientWallet).addSourceToken(ownerWallet.address, recipientWallet.address, 100)).to.be.revertedWith("MergeTokenPortal: forbidden");
        });

        it("Should remove a source token", async function () {
            // Remove the source token
            await mergeTokenPortal.connect(ownerWallet).removeSourceToken(ownerWallet.address);

            // Check that the source token was removed
            let sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(ownerWallet.address);
            expect(sourceTokenInfo.isSupported).to.equal(false);
            expect(sourceTokenInfo.isLocked).to.equal(false);
            expect(sourceTokenInfo.balance).to.equal(0n);
            expect(sourceTokenInfo.depositLimit).to.equal(0n);
        });

        it("Should not allow non-owner to remove a source token", async function () {
            await expect(mergeTokenPortal.connect(recipientWallet).removeSourceToken(ownerWallet.address)).to.be.revertedWith("MergeTokenPortal: forbidden");
        });
    })

    describe("deposit withdraw", function () {
        let mergeTokenPortal1, ERC20Token, erc20Token, erc20MergeAddr1Token, erc20MergeAddr2Token

        beforeEach(async function () {
            mergeTokenPortal1 = await deployContract("MergeTokenPortal", [addr1.address]);
            erc20MergeAddr1Token = await deployContract("ERC20MergeToken", [addr1.address, "addr1", "ADD1TK", 18]);
            erc20MergeAddr2Token = await deployContract("ERC20MergeToken", [addr2.address, "addr2", "ADD2TK", 18]);
        });

        it("Should deposit correctly", async function () {
            await mergeTokenPortal.connect(ownerWallet).addSourceToken(erc20MergeAddr1Token.target, erc20MergeToken.target, 10000);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await erc20MergeAddr1Token.connect(addr2).approve(mergeTokenPortal.target, 1000);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await erc20MergeAddr1Token.connect(addr1).mint(addr2.address, 100);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await mergeTokenPortal.connect(addr2).deposit(erc20MergeAddr1Token.target, 10, addr1.address);
            await new Promise(resolve => setTimeout(resolve, 1000));
            let sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token.target);
            expect(sourceTokenInfo.balance).to.equal(10n);
        });

        it("Should not allow deposit over the limit", async function () {
            const tx = await mergeTokenPortal.connect(ownerWallet).addSourceToken(erc20MergeAddr1Token.target, erc20MergeToken.target, 10);
            await tx.wait();
            const tx1 = await erc20MergeAddr1Token.connect(addr2).approve(mergeTokenPortal.target, 10000);
            await tx1.wait();
            //const data = await mergeTokenPortal.connect(addr3).getSourceTokenInfos(erc20MergeAddr1Token.target);
            await erc20MergeAddr1Token.connect(addr1).mint(addr2.address, 100);

            expect(
                mergeTokenPortal.connect(addr2).deposit(erc20MergeAddr1Token.target, 1000, addr1.address)
            ).to.be.revertedWith("el");
        });

        it("Should allow withdrawal correctly", async function () {
            await mergeTokenPortal.connect(ownerWallet).addSourceToken(erc20MergeAddr1Token.target, erc20MergeToken.target, 10000);
            await new Promise(resolve => setTimeout(resolve, 100));
            await erc20MergeAddr1Token.connect(addr2).approve(mergeTokenPortal.target, 1000);
            await new Promise(resolve => setTimeout(resolve, 100));
            await erc20MergeAddr1Token.connect(addr1).mint(addr2.address, 10000);
            await new Promise(resolve => setTimeout(resolve, 100));
            await mergeTokenPortal.connect(addr2).deposit(erc20MergeAddr1Token.target, 1000, addr1.address);
            await new Promise(resolve => setTimeout(resolve, 100));
            await mergeTokenPortal.connect(addr1).withdraw(erc20MergeAddr1Token.target, 500, addr2.address);
            await new Promise(resolve => setTimeout(resolve, 100));
            let sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token.target);
            expect(sourceTokenInfo.balance).to.equal(500);
        });

        it("Should disable deposit correctly", async function () {
            await mergeTokenPortal.connect(ownerWallet).addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await mergeTokenPortal.connect(ownerWallet).disableDeposit(erc20MergeAddr1Token.target);
            await new Promise(resolve => setTimeout(resolve, 1000));
            const sourceInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token.target);
            expect(sourceInfo.isLocked).to.equal(true);
        });

        it("Should not allow withdrawal more than deposit", async function () {
            await mergeTokenPortal.connect(ownerWallet).addSourceToken(erc20MergeAddr1Token.target, erc20MergeToken.target, 10000);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await erc20MergeAddr1Token.connect(addr2).approve(mergeTokenPortal.target, 1000);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await erc20MergeAddr1Token.connect(addr1).mint(addr2.address, 10000);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await mergeTokenPortal.connect(addr2).deposit(erc20MergeAddr1Token.target, 1000, addr1.address);
            await new Promise(resolve => setTimeout(resolve, 1000));
            expect(mergeTokenPortal.connect(recipientWallet).withdraw(erc20MergeAddr1Token.target, 1500, ownerWallet.address)).to.be.revertedWith("ib");//With("ib"))
        });



        it("Should not allow deposit if disabled", async function () {
            await mergeTokenPortal1.connect(addr1).addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await mergeTokenPortal1.connect(addr1).disableDeposit(erc20MergeAddr1Token.target);
            //await new Promise(resolve => setTimeout(resolve, 1000));
            await erc20MergeAddr1Token.connect(addr2).mint(addr1.address, 10000);
            //await new Promise(resolve => setTimeout(resolve, 1000));
            await expect(mergeTokenPortal1.connect(addr1).deposit(erc20MergeAddr1Token.target, 1000, ownerWallet.address)).to.be.revertedWith("dd");
        });

        it("Should set deposit limit correctly", async function () {
            await mergeTokenPortal.connect(ownerWallet).addSourceToken(erc20MergeAddr1Token.target, erc20MergeToken.target, 10000);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await erc20MergeAddr1Token.connect(ownerWallet).approve(mergeTokenPortal.target, 1000);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await erc20MergeAddr1Token.connect(addr1).mint(ownerWallet.address, 10000);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await mergeTokenPortal.connect(ownerWallet).setDepositLimit(erc20MergeAddr1Token.target, 500);
            let sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token.target);
            expect(sourceTokenInfo.depositLimit).to.equal(500);
        });

        it("Should not allow deposit over the limit", async function () {
            await mergeTokenPortal.connect(ownerWallet).addSourceToken(erc20MergeAddr1Token.target, erc20MergeToken.target, 10000);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await erc20MergeAddr1Token.connect(ownerWallet).approve(mergeTokenPortal.target, 1000);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await erc20MergeAddr1Token.connect(addr1).mint(ownerWallet.address, 10000);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await mergeTokenPortal.connect(ownerWallet).setDepositLimit(erc20MergeAddr1Token.target, 500);
            await expect(mergeTokenPortal.connect(ownerWallet).deposit(erc20MergeAddr1Token, 1000, ownerWallet.address)).to.be.revertedWith("el");
        });
    })
});