const Tokenomics = require("../helpers/Tokenomics.json");
const chai = require('chai');
const BN = require('bn.js');
const chaiAlmost = require('chai-almost');

var should = require('chai').should();

chai.use(chaiAlmost(10));
chai.use(require('chai-bn')(BN));
const { tokenParams } = require("../helpers/config");
const { assertRevert } = require("../helpers/assertRevert");
const { RemoveExpo } = require("../helpers/common");
const BasicToken = artifacts.require("Plugin");

contract("StandardToken", function ([_, owner, recipient, anotherAccount]) {
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  beforeEach(async function () {
    this.token = await BasicToken.new(...tokenParams, { from: owner });
    await this.token.initialize(
      Tokenomics.name,
      Tokenomics.symbol,
      Tokenomics.decimals,
      Tokenomics.initialSupply,
      { from: owner }
    );
  });

  describe("total supply", function () {
    it("returns the total amount of tokens", async function () {
      const totalSupply = await this.token.totalSupply();

      assert.equal(totalSupply, Tokenomics.initialSupply);
    });
  });

  describe("balanceOf", function () {
    describe("when the requested account has no tokens", function () {
      it("returns zero", async function () {
        const balance = await this.token.balanceOf(anotherAccount);

        assert.equal(balance, 0);
      });
    });

    describe("when the requested account has some tokens", function () {
      it("returns the total amount of tokens", async function () {
        const balance = await this.token.balanceOf(owner);

        assert.equal(balance, Tokenomics.initialSupply);
      });
    });
  });

  describe("transfer", function () {
    describe("when the recipient is not the zero address", function () {
      const to = recipient;

      describe("when the sender does not have enough balance", function () {
        const amount = new BN(Tokenomics.initialSupply).add(new BN(1)).toString();

        it("reverts", async function () {
          await assertRevert(this.token.transfer(to, amount, { from: owner }));
        });
      });

      describe("when the sender has enough balance", function () {
        const amount = RemoveExpo(parseFloat(Tokenomics.initialSupply) + 1);

        it("transfers the requested amount", async function () {
          await this.token.transfer(to, amount, { from: owner });

          const senderBalance = await this.token.balanceOf(owner);
          assert.equal(senderBalance, 0);

          const recipientBalance = await this.token.balanceOf(to);
          assert.equal(recipientBalance, amount);
        });

        it("emits a transfer event", async function () {
          const { logs } = await this.token.transfer(to, amount, {
            from: owner,
          });
          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, "Transfer");
          assert.equal(logs[0].args.from, owner);
          assert.equal(logs[0].args.to, to);
          assert(logs[0].args.value.toString() == amount);
        });
      });
    });

    describe("when the recipient is the zero address", function () {
      const to = ZERO_ADDRESS;

      it("reverts", async function () {
        await assertRevert(this.token.transfer(to, 100, { from: owner }));
      });
    });
  });
});
