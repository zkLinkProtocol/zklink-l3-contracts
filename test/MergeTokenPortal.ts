import { expect, assert } from 'chai';
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
        mergeTokenPortal = await deployContract("MergeTokenPortal");
        await mergeTokenPortal.initialize();
        erc20MergeToken = await deployContract("ERC20MergeToken", [ownerWallet.address, "MyToken", "MTK", 18]);
        // console.log(mergeTokenPortal,erc20MergeToken)
    });
    describe("MergeToken", function () {//ethers.parseEther("100")
        // it("Should mint tokens correctly", async function () {
        //     await erc20MergeToken.connect(ownerWallet).mint(recipientWallet.address, 100);
        //     console.log(await erc20MergeToken.balanceOf(recipientWallet.address), "balance")
        //     await expect(await erc20MergeToken.balanceOf(recipientWallet.address)).to.equal(100n);
        // });

        // it("Should set the right owner", async function () {
        //     await new Promise(resolve => setTimeout(resolve, 1000));
        //     await expect(await mergeTokenPortal.owner()).to.equal(ownerWallet.address);
        // });

        // it("Should add source token correctly", async function () {
        //     //await mergeTokenPortal.initialize();
        //     // console.log(await mergeTokenPortal.getSigners(),'xxxxxxxxxxxx');
        //     // 确保上一步已经完成
        //     await new Promise(resolve => setTimeout(resolve, 100));
        //     const tx=await mergeTokenPortal.connect(ownerWallet).addSourceToken(ownerWallet.address, recipientWallet.address, 100);
        //     await tx.wait();
        //     await new Promise(resolve => setTimeout(resolve, 100));
        //     let sourceTokenInfo = await mergeTokenPortal.connect(ownerWallet).getSourceTokenInfos(ownerWallet.address);
        //     expect(sourceTokenInfo.isSupported).to.equal(true);
        //     expect(sourceTokenInfo.isLocked).to.equal(false);
        //     expect(sourceTokenInfo.mergeToken).to.equal(recipientWallet.address);
        //     expect(sourceTokenInfo.balance).to.equal(0n);
        //     expect(sourceTokenInfo.depositLimit).to.equal(100n);
        // });

        // it("Should not allow non-owner to add source token", async function () {
        //     await new Promise(resolve => setTimeout(resolve, 5000));
        //     //await mergeTokenPortal.connect(recipientWallet).initialize();
        //     //const add = await mergeTokenPortal.connect(recipientWallet).addSourceToken(ownerWallet.address, recipientWallet.address,100);
        //     await expect(mergeTokenPortal.connect(recipientWallet).addSourceToken(ownerWallet.address, recipientWallet.address, 100)).to.be.revertedWith("Ownable: caller is not the owner");
        // });

        // it("Should remove a source token", async function () {
        //     await new Promise(resolve => setTimeout(resolve, 1000));
        //     // Remove the source token
        //     await mergeTokenPortal.connect(ownerWallet).removeSourceToken(ownerWallet.address);

        //     // Check that the source token was removed
        //     let sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(ownerWallet.address);
        //     expect(sourceTokenInfo.isSupported).to.equal(false);
        //     expect(sourceTokenInfo.isLocked).to.equal(false);
        //     expect(sourceTokenInfo.balance).to.equal(0n);
        //     expect(sourceTokenInfo.depositLimit).to.equal(0n);
        // });

        // it("Should not allow non-owner to remove a source token", async function () {
        //     await new Promise(resolve => setTimeout(resolve, 2000));
        //     await expect(mergeTokenPortal.connect(recipientWallet).removeSourceToken(ownerWallet.address)).to.be.revertedWith("Ownable: caller is not the owner");
        // });
    })

    describe("deposit withdraw", function () {
        let mergeTokenPortal1, ERC20Token, erc20Token, erc20MergeAddr1Token, erc20MergeAddr2Token

        beforeEach(async function () {
            // mergeTokenPortal1 = await deployContract("MergeTokenPortal");
            // await mergeTokenPortal1.initialize();
            erc20MergeAddr1Token = await deployContract("ERC20MergeToken", [addr1.address, "addr1", "ADD1TK", 18]);
            erc20MergeAddr2Token = await deployContract("ERC20MergeToken", [mergeTokenPortal.target, "addr2", "ADD2TK", 18]);
        });

        // it('should revert when trying to deposit zero amount', async () => {
        //     await expect(mergeTokenPortal.connect(addr2).deposit(erc20MergeAddr1Token.target, 0, addr1.address)).to.be.revertedWith('Deposit amount is zero');
        // });

        // it('should revert when trying to withdraw zero amount', async () => {
        //     await expect(mergeTokenPortal.connect(recipientWallet).withdraw(erc20MergeAddr1Token.target, 0, ownerWallet.address)).to.be.revertedWith('Withdraw amount is zero');
        // });

        // it("Should not allow non-owner to update deposit status", async function () {
        //     await new Promise(resolve => setTimeout(resolve, 1000));
        //     let sourceInfo = await mergeTokenPortal.getSourceTokenInfos(ownerWallet.address);

        //     if (!sourceInfo.isLocked) {
        //         await expect(mergeTokenPortal.connect(addr3).updateDepositStatus(erc20MergeAddr1Token.target, true)).to.be.revertedWith("Ownable: caller is not the owner");
        //     }
        // });
        
        // it("Should not allow non-owner to set deposit limit", async function() {
        //     await new Promise(resolve => setTimeout(resolve, 1000));
        //     const initialAmount= 100;
        //     await expect(mergeTokenPortal.connect(addr3).setDepositLimit(erc20MergeAddr1Token.target,initialAmount)).to.be.revertedWith("Ownable: caller is not the owner");
           
        // });
        // it("Should set deposit limit correctly by only owner ", async () => {
        //     const initialAmount = 100;
        //     await mergeTokenPortal.connect(ownerWallet).addSourceToken(erc20MergeAddr1Token.target, erc20MergeToken.target, 10000);
        //     await new Promise(resolve => setTimeout(resolve, 1000));
        //     await mergeTokenPortal.connect(ownerWallet).setDepositLimit(erc20MergeAddr1Token.target, initialAmount);
        //     await new Promise(resolve => setTimeout(resolve, 1000));
        //     let sourceInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token.target);
        //     await new Promise(resolve => setTimeout(resolve, 1000));
        //     expect(sourceInfo.depositLimit).to.equal(initialAmount);
        // });
        // it("Should deposit correctly", async function () {
        //     await new Promise(resolve => setTimeout(resolve, 500));
        //     await mergeTokenPortal.connect(ownerWallet).addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
        //     await new Promise(resolve => setTimeout(resolve, 500));
        //     await erc20MergeAddr1Token.connect(addr2).approve(mergeTokenPortal.target, 1000);
        //     await new Promise(resolve => setTimeout(resolve, 500));
        //     await erc20MergeAddr1Token.connect(addr1).approve(mergeTokenPortal.target, 1000);
        //     await new Promise(resolve => setTimeout(resolve, 500));
        //     await erc20MergeAddr1Token.connect(addr1).mint(addr2.address, 100);
        //     await new Promise(resolve => setTimeout(resolve, 500));
        //     await erc20MergeAddr1Token.connect(addr1).mint(addr1.address, 100);
        //     await new Promise(resolve => setTimeout(resolve, 500));
        //     await mergeTokenPortal.connect(addr1).deposit(erc20MergeAddr1Token.target, 10, addr1.address);
        //     await new Promise(resolve => setTimeout(resolve, 500));
        //     let sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token.target);
        //     expect(sourceTokenInfo.balance).to.equal(10n);
        // });

        // it("Should not allow deposit over the limit", async function () {
        //     await new Promise(resolve => setTimeout(resolve, 500));
        //     await mergeTokenPortal.connect(ownerWallet).addSourceToken(erc20MergeAddr1Token.target, erc20MergeToken.target, 10);
        //     await new Promise(resolve => setTimeout(resolve, 500));
        //     await erc20MergeAddr1Token.connect(addr2).approve(mergeTokenPortal.target, 10000);
        //     await new Promise(resolve => setTimeout(resolve, 500));
        //     //const data = await mergeTokenPortal.connect(addr3).getSourceTokenInfos(erc20MergeAddr1Token.target);
        //     await erc20MergeAddr1Token.connect(addr1).mint(addr2.address, 100);

        //     expect(
        //         mergeTokenPortal.connect(addr2).deposit(erc20MergeAddr1Token.target, 1000, addr1.address)
        //     ).to.be.revertedWith("el");
        // });

        // it("Should allow withdrawal correctly", async function () {
        //     await mergeTokenPortal.connect(ownerWallet).addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
        //     await new Promise(resolve => setTimeout(resolve, 100));
        //     await erc20MergeAddr1Token.connect(addr2).approve(mergeTokenPortal.target, 1000);
        //     await new Promise(resolve => setTimeout(resolve, 100));
        //     await erc20MergeAddr1Token.connect(addr1).mint(addr2.address, 10000);
        //     await new Promise(resolve => setTimeout(resolve, 100));
        //     await mergeTokenPortal.connect(addr2).deposit(erc20MergeAddr1Token.target, 1000, addr1.address);
        //     await new Promise(resolve => setTimeout(resolve, 100));
        //     await mergeTokenPortal.connect(addr1).withdraw(erc20MergeAddr1Token.target, 500, addr2.address);
        //     await new Promise(resolve => setTimeout(resolve, 100));
        //     let sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token.target);
        //     expect(sourceTokenInfo.balance).to.equal(500);
        // });

        // it("Should disable deposit correctly", async function () {
        //     await mergeTokenPortal.connect(ownerWallet).addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
        //     await new Promise(resolve => setTimeout(resolve, 1000));
        //     await mergeTokenPortal.connect(ownerWallet).updateDepositStatus(erc20MergeAddr1Token.target, true);
        //     await new Promise(resolve => setTimeout(resolve, 1000));
        //     const sourceInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token.target);
        //     expect(sourceInfo.isLocked).to.equal(true);
        // });

        // it("Should not allow withdrawal more than deposit", async function () {
        //     await mergeTokenPortal.connect(ownerWallet).addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
        //     await new Promise(resolve => setTimeout(resolve, 1000));
        //     await erc20MergeAddr1Token.connect(addr2).approve(mergeTokenPortal.target, 1000);
        //     await new Promise(resolve => setTimeout(resolve, 1000));
        //     await erc20MergeAddr1Token.connect(addr1).mint(addr2.address, 10000);
        //     await new Promise(resolve => setTimeout(resolve, 1000));
        //     await mergeTokenPortal.connect(addr2).deposit(erc20MergeAddr1Token.target, 1000, addr1.address);
        //     await new Promise(resolve => setTimeout(resolve, 1000));
        //     expect(mergeTokenPortal.connect(recipientWallet).withdraw(erc20MergeAddr1Token.target, 1500, ownerWallet.address)).to.be.revertedWith("ib");//With("ib"))
        // });



        // it("Should not allow deposit if disabled", async function () {
        //     await mergeTokenPortal.connect(ownerWallet).addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
        //     await new Promise(resolve => setTimeout(resolve, 1000));
        //     await mergeTokenPortal.connect(ownerWallet).updateDepositStatus(erc20MergeAddr1Token.target, true);
        //     //await new Promise(resolve => setTimeout(resolve, 1000));
        //     await erc20MergeAddr1Token.connect(addr1).mint(addr1.address, 10000);
        //     //await new Promise(resolve => setTimeout(resolve, 1000));
        //     await expect(mergeTokenPortal.connect(addr1).deposit(erc20MergeAddr1Token.target, 1000, ownerWallet.address)).to.be.revertedWith("Source token is locked");
        // });

        // it("Should set deposit limit correctly", async function () {
        //     await mergeTokenPortal.connect(ownerWallet).addSourceToken(erc20MergeAddr1Token.target, erc20MergeToken.target, 10000);
        //     await new Promise(resolve => setTimeout(resolve, 1000));
        //     await erc20MergeAddr1Token.connect(ownerWallet).approve(mergeTokenPortal.target, 1000);
        //     await new Promise(resolve => setTimeout(resolve, 1000));
        //     await erc20MergeAddr1Token.connect(addr1).mint(ownerWallet.address, 10000);
        //     await new Promise(resolve => setTimeout(resolve, 1000));
        //     await mergeTokenPortal.connect(ownerWallet).setDepositLimit(erc20MergeAddr1Token.target, 500);
        //     let sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token.target);
        //     expect(sourceTokenInfo.depositLimit).to.equal(500);
        // });

        it("Should not allow deposit over the limit", async function () {
            await mergeTokenPortal.connect(ownerWallet).addSourceToken(erc20MergeAddr1Token.target, erc20MergeToken.target, 10000);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await erc20MergeAddr1Token.connect(ownerWallet).approve(mergeTokenPortal.target, 1000);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await erc20MergeAddr1Token.connect(addr1).mint(ownerWallet.address, 10000);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await mergeTokenPortal.connect(ownerWallet).setDepositLimit(erc20MergeAddr1Token.target, 500);
            await expect(mergeTokenPortal.connect(ownerWallet).deposit(erc20MergeAddr1Token, 1000, ownerWallet.address)).to.be.revertedWith("Source token deposit limit exceeded");
        });
    })
});