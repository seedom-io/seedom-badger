const Web3 = require('web3');

module.exports.fundraiser = (networks, deployments) => {
    // get network name
    const networkName = process.env.NETWORK ? process.env.NETWORK : 'mainnet';
    // setup web3 (to latest fundraiser contract)
    const network = networks[networkName];
    const web3 = new Web3(network.url);
    const release = deployments[networkName].fundraiser[0];
    return new web3.eth.Contract(release.abi, release.address);
}