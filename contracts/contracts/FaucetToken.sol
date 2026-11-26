// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title FaucetToken
/// @notice Token ERC-20 yang bisa diklaim gratis, maksimal sekali per cooldown per alamat.
contract FaucetToken is ERC20, Ownable {
    /// Jumlah token per klaim (dalam satuan terkecil, 18 desimal).
    uint256 public claimAmount = 100 * 10 ** 18;

    /// Jeda minimal antar klaim untuk satu alamat.
    uint256 public cooldown = 1 days;

    /// Kapan terakhir kali sebuah alamat klaim (unix timestamp).
    mapping(address => uint256) public lastClaimAt;

    event Claimed(address indexed user, uint256 amount);
    event FaucetSettingsChanged(uint256 claimAmount, uint256 cooldown);

    error ClaimTooSoon(uint256 nextClaimAt);

    constructor() ERC20("Faucet Token", "FCT") Ownable(msg.sender) {}

    /// @notice Klaim token gratis.
    function claim() external {
        uint256 next = nextClaimAt(msg.sender);
        if (block.timestamp < next) revert ClaimTooSoon(next);

        lastClaimAt[msg.sender] = block.timestamp;
        _mint(msg.sender, claimAmount);
        emit Claimed(msg.sender, claimAmount);
    }

    /// @notice Waktu paling cepat `user` boleh klaim lagi (0 = boleh sekarang).
    function nextClaimAt(address user) public view returns (uint256) {
        uint256 last = lastClaimAt[user];
        return last == 0 ? 0 : last + cooldown;
    }

    /// @notice Pemilik kontrak bisa mengubah jumlah klaim dan cooldown.
    function setFaucetSettings(uint256 newClaimAmount, uint256 newCooldown) external onlyOwner {
        claimAmount = newClaimAmount;
        cooldown = newCooldown;
        emit FaucetSettingsChanged(newClaimAmount, newCooldown);
    }
}
