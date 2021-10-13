pragma solidity ^0.4.24;

import "./Operator.sol";
import "./BurnableToken.sol";
import "./ERC677Token.sol";

contract Plugin is BurnableToken, Operator, ERC677Token {
    string public name;
    string public symbol;
    uint8 public decimals;

    function initialize(
        string _name,
        string _symbol,
        uint8 _decimals,
        uint256 _totalSupply
    ) public initializer {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        balances[msg.sender] = _totalSupply;
        totalSupply_ = _totalSupply;

        _initializeOwner();
        _initializeOperator();
    }

    /**
     * calls internal function _mint()
     */
    function mint(address to, uint256 amount) public onlyOperator {
        _mint(to, amount);
    }

    function destroy() public onlyOwner {
        selfdestruct(owner);
    }

    /**
     * @dev transfer token to a specified address with additional data if the recipient is a contract.
     * @param _to The address to transfer to.
     * @param _value The amount to be transferred.
     * @param _data The extra data to be passed to the receiving contract.
     */
    function transferAndCall(
        address _to,
        uint256 _value,
        bytes _data
    ) public validRecipient(_to) returns (bool success) {
        return super.transferAndCall(_to, _value, _data);
    }

    // MODIFIERS
    modifier validRecipient(address _recipient) {
        require(_recipient != address(0) && _recipient != address(this));
        _;
    }
}
