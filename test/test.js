// const { expect } = require("chai");
// const { ethers } = require("hardhat");
// const maxUint256 = BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935");

// describe("MergeTokenPortal", function () {
//     let MergeTokenPortal, mergeTokenPortal, dev, owner, addr1, addr2;

//     beforeEach(async function () {
//         [dev, owner, addr1, addr2, _] = await ethers.getSigners();
//         MergeTokenPortal = await ethers.getContractFactory("MergeTokenPortal");
//         mergeTokenPortal = await MergeTokenPortal.connect(dev).deploy(owner.address);
//         ERC20MergeToken = await ethers.getContractFactory("ERC20MergeToken");
//         erc20MergeToken = await ERC20MergeToken.deploy(dev.address, "MyToken", "MTK");
//     });


//     describe("MergeToken", function () {
//         it("Should mint tokens correctly", async function () {
//             await erc20MergeToken.mint(addr1.address, ethers.parseEther("100"));
//             expect(await erc20MergeToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
//         });

//         it("Should set the right owner", async function () {
//             expect(await mergeTokenPortal.GOVERNANCE()).to.equal(owner.address);
//         });

//         it("Should add source token correctly", async function () {
//             await mergeTokenPortal.connect(owner).addSourceToken(addr1.address, addr2.address);

//             let sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(addr1.address);
//             expect(sourceTokenInfo.isSupported).to.equal(true);
//             expect(sourceTokenInfo.isLocked).to.equal(false);
//             expect(sourceTokenInfo.mergeToken).to.equal(addr2.address);
//             expect(sourceTokenInfo.balance).to.equal(0);
//             expect(sourceTokenInfo.depositLimit).to.equal(maxUint256);
//         });

//         it("Should not allow non-owner to add source token", async function () {
//             await expect(mergeTokenPortal.connect(addr1).addSourceToken(addr1.address, addr2.address)).to.be.revertedWith("MergeTokenPortal: forbidden");
//         });

//         it("Should remove a source token", async function () {
//             // Remove the source token
//             await mergeTokenPortal.connect(owner).removeSourceToken(addr1.address);

//             // Check that the source token was removed
//             let sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(addr1.address);
//             expect(sourceTokenInfo.isSupported).to.equal(false);
//             expect(sourceTokenInfo.isLocked).to.equal(false);
//             expect(sourceTokenInfo.balance).to.equal(0);
//             expect(sourceTokenInfo.depositLimit).to.equal(0);
//         });

//         it("Should not allow non-owner to remove a source token", async function () {
//             await expect(mergeTokenPortal.connect(addr1).removeSourceToken(addr1.address)).to.be.revertedWith("MergeTokenPortal: forbidden");
//         });
//         describe("deposit withdraw", function () {
//             let ERC20Token, erc20Token, ERC20Token2, erc20Token2

//             beforeEach(async function () {
//                 ERC20Token = await ethers.getContractFactory("ERC20MergeToken");
//                 erc20Token = await ERC20Token.deploy(owner, "MyToken", "MTK");
//                 ERC20Token2 = await ethers.getContractFactory("ERC20MergeToken");
//                 erc20Token2 = await ERC20Token2.deploy(owner, "MyToken", "MTK");
//             });


//             it("Should deposit correctly", async function () {
//                 await erc20Token.connect(owner).mint(owner.address, ethers.parseEther("1000"));
//                 // Mint some tokens for dev
//                 await erc20Token.connect(owner).mint(dev.address, ethers.parseEther("1000"));
//                 const balance = erc20Token.connect(owner).balanceOf(owner.address);
//                 await erc20Token.connect(owner).approve(mergeTokenPortal.target, ethers.parseEther("1000"));
//                 // Add the ERC20 token as a source token
//                 await mergeTokenPortal.connect(owner).addSourceToken(erc20Token.target, erc20Token2.target);
//                 await mergeTokenPortal.connect(owner).deposit(erc20Token.target, ethers.parseEther("10"), owner.address);
//                 // Verify the deposited tokens
//                 let sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(erc20Token.target);
//                 expect(sourceTokenInfo.balance).to.equal(ethers.parseEther("10"));
//             });


//             it("Should not allow deposit over the limit", async function () {
//                 // Mint some tokens to addr1
//                 await erc20Token.connect(owner).mint(addr1.address, ethers.parseEther("1500"));
//                 // Approve the MergeTokenPortal contract to spend addr1's tokens
//                 await erc20Token.connect(addr1).approve(mergeTokenPortal.target, ethers.parseEther("1500"));
//                 // Add the ERC20 token as a source token
//                 await mergeTokenPortal.connect(owner).addSourceToken(erc20Token.target, erc20Token.target);
//                 // Set the deposit limit for the source token
//                 await mergeTokenPortal.connect(owner).setDepositLimit(erc20Token.target, ethers.parseEther("500"));
//                 // Try to deposit more than the limit
//                 await expect(
//                     mergeTokenPortal.connect(addr1).deposit(erc20Token.target, ethers.parseEther("1000"), addr1.address)
//                 ).to.be.revertedWith("el");
//             });

//             it("Should allow withdrawal correctly", async function () {
//                 await erc20Token.connect(owner).mint(owner.address, ethers.parseEther("10000"));
//                 // Mint some tokens for dev
//                 await erc20Token.connect(owner).mint(dev.address, ethers.parseEther("10000"));
//                 const balance = erc20Token.connect(owner).balanceOf(owner.address);
//                 await erc20Token.connect(owner).approve(mergeTokenPortal.target, ethers.parseEther("10000"));
//                 // Add the ERC20 token as a source token
//                 await mergeTokenPortal.connect(owner).addSourceToken(erc20Token.target, erc20Token2.target);
//                 await mergeTokenPortal.connect(owner).deposit(erc20Token.target, 1000, owner.address);
//                 await mergeTokenPortal.connect(owner).withdraw(erc20Token.target, 500, owner.address);
//                 let sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(erc20Token.target);
//                 expect(sourceTokenInfo.balance).to.equal(500);
//             });

//             it("Should not allow withdrawal more than deposit", async function () {
//                 await erc20Token.connect(owner).mint(owner.address, ethers.parseEther("10000"));
//                 // Mint some tokens for dev
//                 await erc20Token.connect(owner).mint(dev.address, ethers.parseEther("10000"));
//                 const balance = erc20Token.connect(owner).balanceOf(owner.address);
//                 await erc20Token.connect(owner).approve(mergeTokenPortal.target, ethers.parseEther("10000"));
//                 // Add the ERC20 token as a source token
//                 await mergeTokenPortal.connect(owner).addSourceToken(erc20Token.target, erc20Token2.target);
//                 await mergeTokenPortal.connect(owner).deposit(erc20Token.target, 1, owner.address);
//                 await expect(mergeTokenPortal.connect(owner).withdraw(erc20Token.target, 1500, owner.address)).to.be.reverted;//With("ib"))
//             });

//             it("Should disable deposit correctly", async function () {
//                 await erc20Token.connect(owner).mint(owner.address, ethers.parseEther("10000"));
//                 // Mint some tokens for dev
//                 await erc20Token.connect(owner).mint(dev.address, ethers.parseEther("10000"));
//                 const balance = erc20Token.connect(owner).balanceOf(owner.address);
//                 await erc20Token.connect(owner).approve(mergeTokenPortal.target, ethers.parseEther("10000"));
//                 // Add the ERC20 token as a source token
//                 await mergeTokenPortal.connect(owner).addSourceToken(erc20Token.target, erc20Token2.target);
//                 await mergeTokenPortal.connect(owner).disableDeposit(erc20Token.target);
//                 let sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(erc20Token.target);
//                 expect(sourceTokenInfo.isLocked).to.equal(true);
//             });

//             it("Should not allow deposit if disabled", async function () {
//                 await erc20Token.connect(owner).mint(owner.address, ethers.parseEther("10000"));
//                 // Mint some tokens for dev
//                 await erc20Token.connect(owner).mint(dev.address, ethers.parseEther("10000"));
//                 const balance = erc20Token.connect(owner).balanceOf(owner.address);
//                 await erc20Token.connect(owner).approve(mergeTokenPortal.target, ethers.parseEther("10000"));
//                 // Add the ERC20 token as a source token
//                 await mergeTokenPortal.connect(owner).addSourceToken(erc20Token.target, erc20Token2.target);
//                 await mergeTokenPortal.connect(owner).disableDeposit(erc20Token.target);
//                 await expect(mergeTokenPortal.connect(owner).deposit(erc20Token.target, 1000, owner.address)).to.be.reverted;
//             });

//             it("Should set deposit limit correctly", async function () {
//                 await erc20Token.connect(owner).mint(owner.address, ethers.parseEther("10000"));
//                 // Mint some tokens for dev
//                 await erc20Token.connect(owner).mint(dev.address, ethers.parseEther("10000"));
//                 const balance = erc20Token.connect(owner).balanceOf(owner.address);
//                 await erc20Token.connect(owner).approve(mergeTokenPortal.target, ethers.parseEther("10000"));
//                 // Add the ERC20 token as a source token
//                 await mergeTokenPortal.connect(owner).addSourceToken(erc20Token.target, erc20Token2.target);
//                 await mergeTokenPortal.connect(owner).setDepositLimit(erc20Token.target, 500);
//                 let sourceTokenInfo = await mergeTokenPortal.getSourceTokenInfos(erc20Token.target);
//                 expect(sourceTokenInfo.depositLimit).to.equal(500);
//             });

//             it("Should not allow deposit over the limit", async function () {
//                 // Mint some tokens to the owner
//                 await erc20Token.connect(owner).mint(owner.address, ethers.parseEther("10000"));
//                 // Mint some tokens for dev
//                 await erc20Token.connect(owner).mint(dev.address, ethers.parseEther("10000"));
//                 const balance = erc20Token.connect(owner).balanceOf(owner.address);
//                 await erc20Token.connect(owner).approve(mergeTokenPortal.target, ethers.parseEther("1000"));
//                 // Add the ERC20 token as a source token
//                 await mergeTokenPortal.connect(owner).addSourceToken(erc20Token.target, erc20Token2.target);
//                 // Deposit the tokena
//                 await mergeTokenPortal.connect(owner).deposit(erc20Token.target, ethers.parseEther("10"), owner.address);
//                 // Verify the deposited tokens            
//                 await mergeTokenPortal.connect(owner).setDepositLimit(erc20Token.target, 500);
//                 await expect(mergeTokenPortal.connect(owner).deposit(erc20Token.target, 1000, owner.address)).to.be.reverted;
//             });
//         });

//     });

// });


