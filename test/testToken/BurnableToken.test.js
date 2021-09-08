const Tokenomics = require('../helpers//Tokenomics.json');
const chai = require('chai');
const BN = require('bn.js');
const chaiAlmost = require('chai-almost');

var should = require('chai').should();

chai.use(chaiAlmost(10));
chai.use(require('chai-bn')(BN));

const BigNumber = web3.BigNumber;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

require('chai').use(require('chai-bignumber')(BigNumber)).should();
const { inLogs } = require('../helpers//expectEvent');

const { assertRevert } = require('../helpers//assertRevert');

const Plugin = artifacts.require('Plugin');

contract('BurnableToken', ([_, owner]) => {
  let burnableToken = null;

  beforeEach(async function () {
    burnableToken = await Plugin.new();
    await burnableToken.initialize(
      Tokenomics.name,
      Tokenomics.symbol,
      Tokenomics.decimals,
      Tokenomics.initialSupply,
      { from: owner }
    );
  });

  describe('as a basic burnable token', function () {
    const from = owner;
    const initialBalance = Tokenomics.initialSupply;

    describe('when the given amount is not greater than balance of the sender', function () {
      const amount = Tokenomics.initialSupply;

      beforeEach(async function () {
        ({ logs: this.logs } = await burnableToken.burn(amount, { from }));
      });

      it('burns the requested amount', async function () {
        const balance = await burnableToken.balanceOf(from);
        assert.equal(balance, initialBalance - amount);
      });

      it('emits a burn event', async function () {
        const event = await inLogs(this.logs, 'Burn');
        assert.equal(event.args.burner, owner);
        assert.equal(event.args.value, amount);
      });

      it('emits a transfer event', async function () {
        const event = await inLogs(this.logs, 'Transfer');
        assert.equal(event.args.from, owner);
        assert.equal(event.args.to, ZERO_ADDRESS);
        assert.equal(event.args.value, amount);
      });
    });

    describe('when the given amount is greater than the balance of the sender', function () {
      const amount = initialBalance + 1;

      it('reverts', async function () {
        await assertRevert(burnableToken.burn(amount, { from }));
      });
    });
  });
});
