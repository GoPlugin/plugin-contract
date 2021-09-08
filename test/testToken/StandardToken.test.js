const { RemoveExpo } = require("../helpers/common");
const { tokenParams } = require("../helpers/config");
const { assertRevert } = require("../helpers/assertRevert");
const StandardTokenMock = artifacts.require("Plugin");
const Tokenomics = require("../helpers/Tokenomics.json");
const chai = require('chai');
const BN = require('bn.js');
const chaiAlmost = require('chai-almost');

var should = require('chai').should();

chai.use(chaiAlmost(10));
chai.use(require('chai-bn')(BN));

// TOTAL SUPPLY - 100

contract("StandardToken", function ([_, owner, recipient, anotherAccount]) {
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  beforeEach(async function () {
    this.token = await StandardTokenMock.new(...tokenParams, { from: owner });
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
      totalSupply.should.be.bignumber.equal(Tokenomics.initialSupply);
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
        balance.should.be.bignumber.equal(Tokenomics.initialSupply);        
      });
    });
  });

  describe("transfer", function () {
    describe("when the recipient is not the zero address", function () {
      const to = recipient;

      describe("when the sender does not have enough balance", function () {
        const amount = new BN(Tokenomics.initialSupply)
          .add(new BN(1))
          .toString();

        it("reverts", async function () {
          await assertRevert(this.token.transfer(to, amount, { from: owner }));
        });
      });

      describe("when the sender has enough balance", function () {
        const amount = Tokenomics.initialSupply;

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

  describe("approve", function () {
    describe("when the spender is not the zero address", function () {
      const spender = recipient;

      describe("when the sender has enough balance", function () {
        const amount = Tokenomics.initialSupply;

        it("emits an approval event", async function () {
          const { logs } = await this.token.approve(spender, amount, {
            from: owner,
          });

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, "Approval");
          assert.equal(logs[0].args.owner, owner);
          assert.equal(logs[0].args.spender, spender);
          assert(logs[0].args.value.toString() == amount);
        });

        describe("when there was no approved amount before", function () {
          it("approves the requested amount", async function () {
            await this.token.approve(spender, amount, { from: owner });

            const allowance = await this.token.allowance(owner, spender);
            assert.equal(allowance, amount);
          });
        });

        describe("when the spender had an approved amount", function () {
          beforeEach(async function () {
            await this.token.approve(spender, 1, { from: owner });
          });

          it("approves the requested amount and replaces the previous one", async function () {
            await this.token.approve(spender, amount, { from: owner });

            const allowance = await this.token.allowance(owner, spender);
            assert.equal(allowance, amount);
          });
        });
      });

      describe("when the sender does not have enough balance", function () {
        const amount = new BN(Tokenomics.initialSupply)
          .add(new BN(1))
          .toString();

        it("emits an approval event", async function () {
          const { logs } = await this.token.approve(spender, amount, {
            from: owner,
          });

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, "Approval");
          assert.equal(logs[0].args.owner, owner);
          assert.equal(logs[0].args.spender, spender);
          assert(logs[0].args.value.toString() == amount);
        });

        describe("when there was no approved amount before", function () {
          it("approves the requested amount", async function () {
            await this.token.approve(spender, amount, { from: owner });

            const allowance = await this.token.allowance(owner, spender);
            assert.equal(allowance, amount);
          });
        });

        describe("when the spender had an approved amount", function () {
          beforeEach(async function () {
            await this.token.approve(spender, 1, { from: owner });
          });

          it("approves the requested amount and replaces the previous one", async function () {
            await this.token.approve(spender, amount, { from: owner });

            const allowance = await this.token.allowance(owner, spender);
            assert.equal(allowance, amount);
          });
        });
      });
    });

    describe("when the spender is the zero address", function () {
      const amount = Tokenomics.initialSupply;
      const spender = ZERO_ADDRESS;

      it("approves the requested amount", async function () {
        await this.token.approve(spender, amount, { from: owner });

        const allowance = await this.token.allowance(owner, spender);
        assert.equal(allowance, amount);
      });

      it("emits an approval event", async function () {
        const { logs } = await this.token.approve(spender, amount, {
          from: owner,
        });

        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, "Approval");
        assert.equal(logs[0].args.owner, owner);
        assert.equal(logs[0].args.spender, spender);
        assert(logs[0].args.value.toString() == amount);
      });
    });
  });

  describe("transfer from", function () {
    const spender = recipient;

    describe("when the recipient is not the zero address", function () {
      const to = anotherAccount;

      describe("when the spender has enough approved balance", function () {
        beforeEach(async function () {
          await this.token.approve(spender, Tokenomics.initialSupply, { from: owner });
        });

        describe("when the owner has enough balance", function () {
          const amount = Tokenomics.initialSupply;

          it("transfers the requested amount", async function () {
            await this.token.transferFrom(owner, to, amount, { from: spender });

            const senderBalance = await this.token.balanceOf(owner);
            assert.equal(senderBalance, 0);

            const recipientBalance = await this.token.balanceOf(to);
            assert.equal(recipientBalance, amount);
          });

          it("decreases the spender allowance", async function () {
            await this.token.transferFrom(owner, to, amount, { from: spender });

            const allowance = await this.token.allowance(owner, spender);
            assert(allowance.toString() == 0);
          });

          it("emits a transfer event", async function () {
            const { logs } = await this.token.transferFrom(owner, to, amount, {
              from: spender,
            });

            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, "Transfer");
            assert.equal(logs[0].args.from, owner);
            assert.equal(logs[0].args.to, to);
            assert(logs[0].args.value.toString() == amount);
          });
        });

        describe("when the owner does not have enough balance", function () {
          const amount = new BN(Tokenomics.initialSupply)
            .add(new BN(1))
            .toString();

          it("reverts", async function () {
            await assertRevert(
              this.token.transferFrom(owner, to, amount, { from: spender })
            );
          });
        });
      });

      describe("when the spender does not have enough approved balance", function () {
        beforeEach(async function () {
          await this.token.approve(spender, 99, { from: owner });
        });

        describe("when the owner has enough balance", function () {
          const amount = Tokenomics.initialSupply;

          it("reverts", async function () {
            await assertRevert(
              this.token.transferFrom(owner, to, amount, { from: spender })
            );
          });
        });

        describe("when the owner does not have enough balance", function () {
          const amount = new BN(Tokenomics.initialSupply)
            .add(new BN(1))
            .toString();

          it("reverts", async function () {
            await assertRevert(
              this.token.transferFrom(owner, to, amount, { from: spender })
            );
          });
        });
      });
    });

    describe("when the recipient is the zero address", function () {
      const amount = Tokenomics.initialSupply;
      const to = ZERO_ADDRESS;

      beforeEach(async function () {
        await this.token.approve(spender, amount, { from: owner });
      });

      it("reverts", async function () {
        await assertRevert(
          this.token.transferFrom(owner, to, amount, { from: spender })
        );
      });
    });
  });

  describe("decrease approval", function () {
    describe("when the spender is not the zero address", function () {
      const spender = recipient;

      describe("when the sender has enough balance", function () {
        const amount = Tokenomics.initialSupply;

        it("emits an approval event", async function () {
          const { logs } = await this.token.decreaseApproval(spender, amount, {
            from: owner,
          });

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, "Approval");
          assert.equal(logs[0].args.owner, owner);
          assert.equal(logs[0].args.spender, spender);
          assert(logs[0].args.value.toString() == 0);
        });

        describe("when there was no approved amount before", function () {
          it("keeps the allowance to zero", async function () {
            await this.token.decreaseApproval(spender, amount, { from: owner });

            const allowance = await this.token.allowance(owner, spender);
            assert.equal(allowance, 0);
          });
        });

        describe("when the spender had an approved amount", function () {
          const approvedAmount = amount;

          beforeEach(async function () {
            await this.token.approve(spender, approvedAmount, { from: owner });
          });

          it("decreases the spender allowance subtracting the requested amount", async function () {
            await this.token.decreaseApproval(spender, new BN(approvedAmount).sub(new BN(5)), {
              from: owner,
            });

            const allowance = await this.token.allowance(owner, spender);
            assert.equal(allowance, 5);
          });

          it("sets the allowance to zero when all allowance is removed", async function () {
            await this.token.decreaseApproval(spender, approvedAmount, {
              from: owner,
            });
            const allowance = await this.token.allowance(owner, spender);
            assert.equal(allowance, 0);
          });

          it("sets the allowance to zero when more than the full allowance is removed", async function () {
            await this.token.decreaseApproval(spender,  new BN(approvedAmount).add(new BN(5)), {
              from: owner,
            });
            const allowance = await this.token.allowance(owner, spender);
            assert.equal(allowance, 0);
          });
        });
      });

      describe("when the sender does not have enough balance", function () {
        const amount = new BN(Tokenomics.initialSupply)
          .add(new BN(1))
          .toString();

        it("emits an approval event", async function () {
          const { logs } = await this.token.decreaseApproval(spender, amount, {
            from: owner,
          });

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, "Approval");
          assert.equal(logs[0].args.owner, owner);
          assert.equal(logs[0].args.spender, spender);
          assert(logs[0].args.value.toString() == 0);
        });

        describe("when there was no approved amount before", function () {
          it("keeps the allowance to zero", async function () {
            await this.token.decreaseApproval(spender, amount, { from: owner });

            const allowance = await this.token.allowance(owner, spender);
            assert.equal(allowance, 0);
          });
        });

        describe("when the spender had an approved amount", function () {
          beforeEach(async function () {
            await this.token.approve(spender, new BN(amount).add(new BN(1)), { from: owner });
          });

          it("decreases the spender allowance subtracting the requested amount", async function () {
            await this.token.decreaseApproval(spender, amount, { from: owner });

            const allowance = await this.token.allowance(owner, spender);
            assert.equal(allowance, 1);
          });
        });
      });
    });

    describe("when the spender is the zero address", function () {
      const amount = Tokenomics.initialSupply;
      const spender = ZERO_ADDRESS;

      it("decreases the requested amount", async function () {
        await this.token.decreaseApproval(spender, amount, { from: owner });

        const allowance = await this.token.allowance(owner, spender);
        assert.equal(allowance, 0);
      });

      it("emits an approval event", async function () {
        const { logs } = await this.token.decreaseApproval(spender, amount, {
          from: owner,
        });

        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, "Approval");
        assert.equal(logs[0].args.owner, owner);
        assert.equal(logs[0].args.spender, spender);
        assert(logs[0].args.value.toString() == 0);
      });
    });
  });

  describe("increase approval", function () {
    const amount = Tokenomics.initialSupply;

    describe("when the spender is not the zero address", function () {
      const spender = recipient;

      describe("when the sender has enough balance", function () {
        it("emits an approval event", async function () {
          const { logs } = await this.token.increaseApproval(spender, amount, {
            from: owner,
          });

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, "Approval");
          assert.equal(logs[0].args.owner, owner);
          assert.equal(logs[0].args.spender, spender);
          assert(logs[0].args.value.toString() == amount);
        });

        describe("when there was no approved amount before", function () {
          it("approves the requested amount", async function () {
            await this.token.increaseApproval(spender, amount, { from: owner });

            const allowance = await this.token.allowance(owner, spender);
            assert.equal(allowance, amount);
          });
        });

        describe("when the spender had an approved amount", function () {
          beforeEach(async function () {
            await this.token.approve(spender, 1, { from: owner });
          });

          it("increases the spender allowance adding the requested amount", async function () {
            await this.token.increaseApproval(spender, amount, { from: owner });

            const allowance = await this.token.allowance(owner, spender);
            allowance.should.be.bignumber.equal(new BN(amount).add(new BN(1)));
          });
        });
      });

      describe("when the sender does not have enough balance", function () {
        const amount = new BN(Tokenomics.initialSupply)
          .add(new BN(1))
          .toString();

        it("emits an approval event", async function () {
          const { logs } = await this.token.increaseApproval(spender, amount, {
            from: owner,
          });

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, "Approval");
          assert.equal(logs[0].args.owner, owner);
          assert.equal(logs[0].args.spender, spender);
          assert(logs[0].args.value.toString() == amount);
        });

        describe("when there was no approved amount before", function () {
          it("approves the requested amount", async function () {
            await this.token.increaseApproval(spender, amount, { from: owner });

            const allowance = await this.token.allowance(owner, spender);
            assert.equal(allowance, amount);
          });
        });

        describe("when the spender had an approved amount", function () {
          beforeEach(async function () {
            await this.token.approve(spender, 1, { from: owner });
          });

          it("increases the spender allowance adding the requested amount", async function () {
            await this.token.increaseApproval(spender, amount, { from: owner });

            const allowance = await this.token.allowance(owner, spender);
            allowance.should.be.bignumber.equal(new BN(amount).add(new BN(1)));
            // assert.equal(allowance, new BN(amount).add(new BN(1)));
          });
        });
      });
    });

    describe("when the spender is the zero address", function () {
      const spender = ZERO_ADDRESS;

      it("approves the requested amount", async function () {
        await this.token.increaseApproval(spender, amount, { from: owner });

        const allowance = await this.token.allowance(owner, spender);
        assert.equal(allowance, amount);
      });

      it("emits an approval event", async function () {
        const { logs } = await this.token.increaseApproval(spender, amount, {
          from: owner,
        });

        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, "Approval");
        assert.equal(logs[0].args.owner, owner);
        assert.equal(logs[0].args.spender, spender);
        assert(logs[0].args.value.toString() == amount);
      });
    });
  });
});
