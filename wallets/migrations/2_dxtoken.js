const DXToken = artifacts.require("./DXToken.sol");

module.exports = function (deployer) {
  deployer.deploy(DXToken);
};
