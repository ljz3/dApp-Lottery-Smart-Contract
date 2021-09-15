pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "hardhat/console.sol";



contract Lottery is AccessControl{
    
    IERC20 public ERC20Token;
    bytes32 public constant OWNER = keccak256("OWNER");

    uint public entry_fee = 20;
    uint public poolContributionBasis = 9500;
    uint public ownerFeeBasis = 500;
    uint public poolContribution = SafeMath.div(SafeMath.mul(entry_fee, poolContributionBasis), 10000);
    uint public ownerFee = SafeMath.div(SafeMath.mul(entry_fee, ownerFeeBasis), 10000);
    uint public constant cooldown = 300;
    
    address public winner;
    address[] public players;
    
    uint public last_drawn;
    uint public lotteriesCount;
    uint public pool;
    uint public fees;

    constructor(address _tokenAddress) public {
        ERC20Token = IERC20(_tokenAddress);
        _setupRole(OWNER, msg.sender);
    }
    
    modifier isOwner(){
        require(hasRole(OWNER, msg.sender), "Caller is not the OWNER");
        _;
    }

    modifier offCooldown(){
        require(block.timestamp > (last_drawn + cooldown));
        _;
    }
    
    function enter() public {
        ERC20Token.transferFrom(msg.sender, address(this), entry_fee * 10**18);
        pool += poolContribution;
        fees += ownerFee;
        players.push(msg.sender);
    }
    
    function random(uint nonce) private view returns(uint) {
        return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, nonce)));
    }
    
    function pickWinner() public isOwner offCooldown {        
        uint index = random(players.length) % players.length;
        winner = players[index];
    }

    function withdraw() public isOwner {
        ERC20Token.transferFrom(address(this), msg.sender, fees);
        fees = 0;
    }

    function payout() public isOwner {
        ERC20Token.approve(address(this), pool * 10**18);
        ERC20Token.transferFrom(address(this), winner, pool * 10**18);
        pool = 0;
    }

    function changeEntry(uint fee, uint poolBasis, uint ownerBasis) public isOwner {
        entry_fee = fee;
        poolContributionBasis = poolBasis;
        ownerFeeBasis = ownerBasis;
        poolContribution = SafeMath.div(SafeMath.mul(entry_fee, poolContributionBasis), 10000);
        ownerFee = SafeMath.div(SafeMath.mul(entry_fee, ownerFeeBasis), 10000);
    }
}