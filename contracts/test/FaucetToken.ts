import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();
const ONE_DAY = 24 * 60 * 60;

async function deploy() {
  const [owner, alice, bob] = await ethers.getSigners();
  const token = await ethers.deployContract("FaucetToken");
  return { token, owner, alice, bob };
}

describe("FaucetToken", function () {
  it("has the right name, symbol and zero supply at start", async function () {
    const { token } = await networkHelpers.loadFixture(deploy);
    expect(await token.name()).to.equal("Faucet Token");
    expect(await token.symbol()).to.equal("FCT");
    expect(await token.totalSupply()).to.equal(0n);
  });

  it("lets a user claim 100 FCT and emits Claimed", async function () {
    const { token, alice } = await networkHelpers.loadFixture(deploy);
    await expect(token.connect(alice).claim())
      .to.emit(token, "Claimed")
      .withArgs(alice.address, ethers.parseEther("100"));
    expect(await token.balanceOf(alice.address)).to.equal(ethers.parseEther("100"));
  });

  it("blocks a second claim before the cooldown ends", async function () {
    const { token, alice } = await networkHelpers.loadFixture(deploy);
    await token.connect(alice).claim();
    await expect(token.connect(alice).claim()).to.be.revertedWithCustomError(token, "ClaimTooSoon");
  });

  it("allows claiming again after 24 hours", async function () {
    const { token, alice } = await networkHelpers.loadFixture(deploy);
    await token.connect(alice).claim();
    await networkHelpers.time.increase(ONE_DAY);
    await token.connect(alice).claim();
    expect(await token.balanceOf(alice.address)).to.equal(ethers.parseEther("200"));
  });

  it("tracks cooldown per address", async function () {
    const { token, alice, bob } = await networkHelpers.loadFixture(deploy);
    await token.connect(alice).claim();
    await token.connect(bob).claim(); // bob tidak terpengaruh cooldown alice
    expect(await token.balanceOf(bob.address)).to.equal(ethers.parseEther("100"));
  });

  it("only lets the owner change settings", async function () {
    const { token, owner, alice } = await networkHelpers.loadFixture(deploy);
    await expect(token.connect(alice).setFaucetSettings(1n, 1n))
      .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    await expect(token.connect(owner).setFaucetSettings(ethers.parseEther("5"), 60n))
      .to.emit(token, "FaucetSettingsChanged");
    expect(await token.claimAmount()).to.equal(ethers.parseEther("5"));
  });
});
