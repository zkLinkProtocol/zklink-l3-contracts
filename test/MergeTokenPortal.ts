const { expect, assert } = require('chai');
const hre = require("hardhat")
const { ethers } = require("hardhat")
// const { upgrades } = require('hardhat')

describe("MergeToeknPortal", function () {
    let mergeTokenPortal, erc2OSource0MergenToeken;
    let owner, recipient, addr1, addr2, addr3;

    beforeEach(async function () {
        [owner, recipient, addr1, addr2, addr3] = await hre.ethers.getSigners()
        //const MergeTokenPortalFactory = await ethers.getContractFactory("MergeTokenPortal");
        const MergeTokenPortal = await ethers.getContractFactory("MergeTokenPortal");
   
        // console.log("MergeTokenPortal Beacon Proxy deployed to:", proxy.address);
        mergeTokenPortal = await MergeTokenPortal.deploy();
        mergeTokenPortal.connect(owner).initialize();
        const ERC20SourceToeknFactory = await ethers.getContractFactory("ERC20MergeToken");
        erc2OSource0MergenToeken = await ERC20SourceToeknFactory.deploy(owner.address, "My Source Token", "MTK", 18);
    })

    describe("MergeToken", function () {
        it("Should mint tokens onlyPortal", async function () {
            await expect(erc2OSource0MergenToeken.connect(recipient).mint(recipient.address, 100)).to.be.revertedWith("Not portal");
        });

        it("Should mint tokens correctly", async function () {
            await erc2OSource0MergenToeken.connect(owner).mint(recipient.address, 100);
            await expect(await erc2OSource0MergenToeken.balanceOf(recipient.address)).to.equal(100n);
        });

        it("Should burn tokens correctly", async function () {
            await erc2OSource0MergenToeken.connect(owner).mint(recipient.address, 200);
            await erc2OSource0MergenToeken.connect(owner).burn(recipient.address, 100);
            await expect(await erc2OSource0MergenToeken.balanceOf(recipient.address)).to.equal(100n);
        });

        it("Should burn tokens onlyPortal", async function () {
            await expect(erc2OSource0MergenToeken.connect(recipient).burn(recipient.address, 100)).to.be.revertedWith("Not portal");
        });

        it("Should set the right owner", async function () {

            await expect(await mergeTokenPortal.owner()).to.equal(owner.address);
        });

        it("Should add source token correctly", async function () {
            const tx = await mergeTokenPortal.connect(owner).addSourceToken(owner.address, recipient.address, 100);
            let sourceTokenInfo = await mergeTokenPortal.connect(owner).getSourceTokenInfos(owner.address);
            expect(sourceTokenInfo.isSupported).to.equal(true);
            expect(sourceTokenInfo.isLocked).to.equal(false);
            expect(sourceTokenInfo.mergeToken).to.equal(recipient.address);
            expect(sourceTokenInfo.balance).to.equal(0n);
            expect(sourceTokenInfo.depositLimit).to.equal(100n);
        });

        it("Should bot add source token if Invalid token address", async function () {
            await expect(mergeTokenPortal.connect(owner).addSourceToken("0x0000000000000000000000000000000000000000", recipient.address, 100)).to.be.revertedWith("Invalid token address");
        });

        it("Should not allow non-owner to add source token", async function () {
            await expect(mergeTokenPortal.connect(recipient).addSourceToken(owner.address, recipient.address, 100)).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should remove a source token", async function () {
            await mergeTokenPortal.connect(owner).removeSourceToken(owner.address);
            let sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(owner.address);
            expect(sourceTokenInfo.isSupported).to.equal(false);
            expect(sourceTokenInfo.isLocked).to.equal(false);
            expect(sourceTokenInfo.balance).to.equal(0n);
            expect(sourceTokenInfo.depositLimit).to.equal(0n);
        });

        it("Should not allow non-owner to remove a source token", async function () {
            await expect(mergeTokenPortal.connect(recipient).removeSourceToken(owner.address)).to.be.revertedWith("Ownable: caller is not the owner");
        });


    })
    describe("deposit withdraw", function () {
        let mergeTokenPortal1, ERC20TokenFactory, erc20MergeAddr1Token, erc20MergeAddr2Token
        beforeEach(async function () {
            ERC20TokenFactory = await ethers.getContractFactory("ERC20MergeToken");
            erc20MergeAddr1Token = await ERC20TokenFactory.deploy(addr1.address, "addr1", "ADD1TK", 18);
            erc20MergeAddr2Token = await ERC20TokenFactory.deploy(mergeTokenPortal.target, "addr2", "ADD2TK", 18);
        });

        it('should revert when trying to deposit unsupported token', async () => {
            await expect(mergeTokenPortal.connect(addr2).deposit(erc20MergeAddr1Token.target, 1000, addr1.address)).to.be.revertedWith('Source token is not supported');
        });

        it("Should not allow non-owner to update deposit status when token is supported", async function () {
            await mergeTokenPortal.connect(owner).addSourceToken(erc20MergeAddr1Token.target, erc2OSource0MergenToeken.target, 10000);
            let sourceInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token.target);
            if (sourceInfo.isSupported) {
                await expect(mergeTokenPortal.connect(addr3).updateDepositStatus(erc20MergeAddr1Token.target, true)).to.be.revertedWith("Ownable: caller is not the owner");
            }
        });

        it('should revert when trying to deposit unsupported token', async () => {
            await expect(mergeTokenPortal.connect(addr2).deposit(erc20MergeAddr1Token.target, 1000, addr1.address)).to.be.revertedWith('Source token is not supported');
        });

        it("Should not allow non-owner to remove a source token with balance", async function () {
            await mergeTokenPortal.connect(owner).addSourceToken(erc20MergeAddr1Token.target, erc2OSource0MergenToeken.target, 10000);
            await erc20MergeAddr1Token.connect(addr3).approve(mergeTokenPortal.target, 500);
            // Mint some tokens and deposit them
            let sourceInfo = await mergeTokenPortal.getSourceTokenInfos(owner.address);

            if (sourceInfo.balance > 0) {
                expect(await mergeTokanPotal.removeSourceTkoen(owner.addrss())).to.be.revertedWith("Ownable: caller is not the owner");
            }
        });
        it('should revert when trying to deposit zero amount', async () => {
            await expect(mergeTokenPortal.connect(addr2).deposit(erc20MergeAddr1Token.target, 0, addr1.address)).to.be.revertedWith('Deposit amount is zero');
        });

        it('should revert when trying to withdraw zero amount', async () => {
            await expect(mergeTokenPortal.connect(recipient).withdraw(erc20MergeAddr1Token.target, 0, owner.address)).to.be.revertedWith('Withdraw amount is zero');
        });

        it("Should not allow non-owner to update deposit status", async function () {
            let sourceInfo = await mergeTokenPortal.getSourceTokenInfos(owner.address);
            if (!sourceInfo.isLocked) {
                await expect(mergeTokenPortal.connect(addr3).updateDepositStatus(erc20MergeAddr1Token.target, true)).to.be.revertedWith("Ownable: caller is not the owner");
            }
        });

        it("Should not allow non-owner to set deposit limit", async function () {
            const initialAmount = 100;
            await expect(mergeTokenPortal.connect(addr3).setDepositLimit(erc20MergeAddr1Token.target, initialAmount)).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should set deposit limit correctly by only owner ", async () => {
            const initialAmount = 100;
            await mergeTokenPortal.connect(owner).addSourceToken(erc20MergeAddr1Token.target, erc2OSource0MergenToeken.target, 10000);
            await mergeTokenPortal.connect(owner).setDepositLimit(erc20MergeAddr1Token.target, initialAmount);
            let sourceInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token.target);
            expect(sourceInfo.depositLimit).to.equal(initialAmount);
        });

        it("Should deposit correctly", async function () {
            await mergeTokenPortal.connect(owner).addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
            await erc20MergeAddr1Token.connect(addr2).approve(mergeTokenPortal.target, 1000);
            await erc20MergeAddr1Token.connect(addr1).approve(mergeTokenPortal.target, 1000);
            await erc20MergeAddr1Token.connect(addr1).mint(addr2.address, 100);
            await erc20MergeAddr1Token.connect(addr1).mint(addr1.address, 100);
            await mergeTokenPortal.connect(addr1).deposit(erc20MergeAddr1Token.target, 10, addr1.address);
            let sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token.target);
            expect(sourceTokenInfo.balance).to.equal(10n);
        });

        it("Should not deposit if Source token is not supported", async function () {
            await erc20MergeAddr1Token.connect(addr2).approve(mergeTokenPortal.target, 1000);
            await erc20MergeAddr1Token.connect(addr1).approve(mergeTokenPortal.target, 1000);
            await erc20MergeAddr1Token.connect(addr1).mint(addr2.address, 100);
            await erc20MergeAddr1Token.connect(addr1).mint(addr1.address, 100);
            await expect(mergeTokenPortal.connect(owner).deposit(erc20MergeAddr1Token.target, 10, addr1.address)).to.be.revertedWith("Source token is not supported");
        });

        it("Should not remove a source token if Source Token balance is not zero", async function () {
            await mergeTokenPortal.connect(owner).addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
            await erc20MergeAddr1Token.connect(addr2).approve(mergeTokenPortal.target, 1000);
            await erc20MergeAddr1Token.connect(addr1).approve(mergeTokenPortal.target, 1000);
            await erc20MergeAddr1Token.connect(addr1).mint(addr2.address, 100);
            await erc20MergeAddr1Token.connect(addr1).mint(addr1.address, 100);
            await mergeTokenPortal.connect(addr1).deposit(erc20MergeAddr1Token.target, 10, addr1.address);
            await expect(mergeTokenPortal.connect(owner).removeSourceToken(erc20MergeAddr1Token.target)).to.be.revertedWith("Source Token balance is not zero");
        });

        it("Should disabledeposit amount is zero", async function () {
            await mergeTokenPortal.connect(owner).addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
            await erc20MergeAddr1Token.connect(addr2).approve(mergeTokenPortal.target, 1000);
            await erc20MergeAddr1Token.connect(addr1).approve(mergeTokenPortal.target, 1000);
            await erc20MergeAddr1Token.connect(addr1).mint(addr2.address, 100);
            await erc20MergeAddr1Token.connect(addr1).mint(addr1.address, 100);
            await expect(mergeTokenPortal.connect(addr1).deposit(erc20MergeAddr1Token.target, 0, addr1.address)).to.be.revertedWith("Deposit amount is zero");
        });

        it("Should disable updateDepositStatus if Source token is not supported", async function () {
            await erc20MergeAddr1Token.connect(addr2).approve(mergeTokenPortal.target, 1000);
            await erc20MergeAddr1Token.connect(addr1).approve(mergeTokenPortal.target, 1000);
            await erc20MergeAddr1Token.connect(addr1).mint(addr2.address, 100);
            await erc20MergeAddr1Token.connect(addr1).mint(addr1.address, 100);
            await expect(mergeTokenPortal.connect(owner).updateDepositStatus(erc20MergeAddr1Token.target, true)).to.be.revertedWith("Source token is not supported");
        });

        it("Should disable updateDepositStatus if Source token is not supported", async function () {
            await erc20MergeAddr1Token.connect(addr2).approve(mergeTokenPortal.target, 1000);
            await erc20MergeAddr1Token.connect(addr1).approve(mergeTokenPortal.target, 1000);
            await erc20MergeAddr1Token.connect(addr1).mint(addr2.address, 100);
            await erc20MergeAddr1Token.connect(addr1).mint(addr1.address, 100);
            await expect(mergeTokenPortal.connect(owner).setDepositLimit(erc20MergeAddr1Token.target, 100)).to.be.revertedWith("Source token is not supported");
        });

        it("Should disabledeposit if Source token is not supported", async function () {
            await erc20MergeAddr1Token.connect(addr2).approve(mergeTokenPortal.target, 1000);
            await erc20MergeAddr1Token.connect(addr1).approve(mergeTokenPortal.target, 1000);
            await erc20MergeAddr1Token.connect(addr1).mint(addr2.address, 100);
            await erc20MergeAddr1Token.connect(addr1).mint(addr1.address, 100);
            await expect(mergeTokenPortal.connect(addr1).deposit(erc20MergeAddr1Token.target, 10, addr1.address)).to.be.revertedWith("Source token is not supported");
        });

        it("Should not allow deposit over the limit", async function () {
            await mergeTokenPortal.connect(owner).addSourceToken(erc20MergeAddr1Token.target, erc2OSource0MergenToeken.target, 10);
            await erc20MergeAddr1Token.connect(addr2).approve(mergeTokenPortal.target, 10000);
            await erc20MergeAddr1Token.connect(addr1).mint(addr2.address, 100);
            expect(
                mergeTokenPortal.connect(addr2).deposit(erc20MergeAddr1Token.target, 1000, addr1.address)
            ).to.be.revertedWith("el");
        });

        it("Should allow withdrawal correctly", async function () {
            await mergeTokenPortal.connect(owner).addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
            await erc20MergeAddr1Token.connect(addr2).approve(mergeTokenPortal.target, 1000);
            await erc20MergeAddr1Token.connect(addr1).mint(addr2.address, 10000);
            await mergeTokenPortal.connect(addr2).deposit(erc20MergeAddr1Token.target, 1000, addr1.address);
            await mergeTokenPortal.connect(addr1).withdraw(erc20MergeAddr1Token.target, 500, addr2.address);
            let sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token.target);
            expect(sourceTokenInfo.balance).to.equal(500);
        });

        it("Should not allow withdrawal if Source Token balance is not enough", async function () {
            await mergeTokenPortal.connect(owner).addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
            await erc20MergeAddr1Token.connect(addr2).approve(mergeTokenPortal.target, 1000);
            await erc20MergeAddr1Token.connect(addr1).mint(addr2.address, 10000);
            await mergeTokenPortal.connect(addr2).deposit(erc20MergeAddr1Token.target, 1000, addr1.address);
            expect(mergeTokenPortal.connect(addr1).withdraw(erc20MergeAddr1Token.target, 50000, addr2.address)).to.be.revertedWith("Source Token balance is not enough");
        });

        it("Should disable deposit correctly", async function () {
            await mergeTokenPortal.connect(owner).addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
            await mergeTokenPortal.connect(owner).updateDepositStatus(erc20MergeAddr1Token.target, true);
            const sourceInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token.target);
            expect(sourceInfo.isLocked).to.equal(true);
        });

        it("Should not allow withdrawal more than deposit", async function () {
            await mergeTokenPortal.connect(owner).addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
            await erc20MergeAddr1Token.connect(addr2).approve(mergeTokenPortal.target, 1000);
            await erc20MergeAddr1Token.connect(addr1).mint(addr2.address, 10000);
            await mergeTokenPortal.connect(addr2).deposit(erc20MergeAddr1Token.target, 1000, addr1.address);
            expect(mergeTokenPortal.connect(recipient).withdraw(erc20MergeAddr1Token.target, 1500, owner.address)).to.be.revertedWith("ib");//With("ib"))
        });

        it("Should not allow withdrawal if Withdraw amount is zero", async function () {
            await mergeTokenPortal.connect(owner).addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
            await erc20MergeAddr1Token.connect(addr2).approve(mergeTokenPortal.target, 1000);
            await erc20MergeAddr1Token.connect(addr1).mint(addr2.address, 10000);
            await mergeTokenPortal.connect(addr2).deposit(erc20MergeAddr1Token.target, 1000, addr1.address);
            expect(mergeTokenPortal.connect(recipient).withdraw(erc20MergeAddr1Token.target, 0, owner.address)).to.be.revertedWith("Withdraw amount is zero");//With("ib"))
        });

        it("Should not allow deposit if disabled", async function () {
            await mergeTokenPortal.connect(owner).addSourceToken(erc20MergeAddr1Token.target, erc20MergeAddr2Token.target, 10000);
            await mergeTokenPortal.connect(owner).updateDepositStatus(erc20MergeAddr1Token.target, true);
            await erc20MergeAddr1Token.connect(addr1).mint(addr1.address, 10000);
            await expect(mergeTokenPortal.connect(addr1).deposit(erc20MergeAddr1Token.target, 1000, owner.address)).to.be.revertedWith("Source token is locked");
        });

        it("Should set deposit limit correctly", async function () {
            await mergeTokenPortal.connect(owner).addSourceToken(erc20MergeAddr1Token.target, erc2OSource0MergenToeken.target, 10000);
            await erc20MergeAddr1Token.connect(owner).approve(mergeTokenPortal.target, 1000);
            await erc20MergeAddr1Token.connect(addr1).mint(owner.address, 10000);
            await mergeTokenPortal.connect(owner).setDepositLimit(erc20MergeAddr1Token.target, 500);
            let sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(erc20MergeAddr1Token.target);
            expect(sourceTokenInfo.depositLimit).to.equal(500);
        });

        it("Should not allow deposit over the limit", async function () {
            await mergeTokenPortal.connect(owner).addSourceToken(erc20MergeAddr1Token.target, erc2OSource0MergenToeken.target, 10000);
            await erc20MergeAddr1Token.connect(owner).approve(mergeTokenPortal.target, 1000);
            await erc20MergeAddr1Token.connect(addr1).mint(owner.address, 10000);
            await mergeTokenPortal.connect(owner).setDepositLimit(erc20MergeAddr1Token.target, 500);
            await expect(mergeTokenPortal.connect(owner).deposit(erc20MergeAddr1Token, 1000, owner.address)).to.be.revertedWith("Source token deposit limit exceeded");
        });

    })
})
