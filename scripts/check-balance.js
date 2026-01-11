const { ethers } = require("hardhat");

async function main() {
    try {
        const [signer] = await ethers.getSigners();
        console.log("ADDRESS=" + signer.address);
        const balance = await ethers.provider.getBalance(signer.address);
        console.log("BALANCE=" + ethers.formatEther(balance));
    } catch (error) {
        console.error(error);
        process.exitCode = 1;
    }
}

main();
