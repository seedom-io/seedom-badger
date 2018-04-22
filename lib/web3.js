const Web3 = require('web3');
const moment = require('moment-timezone');
const download = require('../lib/download');
const file = require('../lib/file');

const causeImageUrlTemplate = 'https://raw.githubusercontent.com/seedom-io/seedom-assets/master/causes/{cause}.png';
const causeJsonUrlTemplate = 'https://raw.githubusercontent.com/seedom-io/seedom-assets/master/causes/{cause}.json';

module.exports.fundraisers = (config) => {
    // get network name
    const networkName = process.env.NETWORK ? process.env.NETWORK : 'mainnet';
    // setup web3 (to latest fundraiser contract)
    const network = config.networks[networkName];
    const web3 = new Web3(network.url);
    const deployment = config.deployments[networkName];

    const fundraisers = {};
    // gather all fundraiser releases
    for (const release of deployment.fundraiser) {
        fundraisers[release.address] = new web3.eth.Contract(release.abi, release.address);
    }

    return fundraisers;
};

module.exports.deployments = async (fundraisers) => {
    const deployments = {};
    // loop over last 6 contracts to execute call
    for (const address in fundraisers) {
        const fundraiser = fundraisers[address];
        const deployment = await fundraiser.methods.deployment().call();
        const endTime = moment(deployment._endTime * 1000).tz('America/New_York');
        deployments[address] = {
            cause: deployment._cause.toLowerCase(),
            endTime: {
                top: endTime.format('LL'),
                bottom: endTime.format('ha z')
            }
        };
    }

    return deployments;
};

module.exports.causes = async (deployments, url) => {
    const causes = {};
    for (const address in deployments) {
        const deployment = deployments[address];
        const imageUrl = causeImageUrlTemplate.replace('{cause}', deployment.cause);
        const jsonUrl = causeJsonUrlTemplate.replace('{cause}', deployment.cause);
        const json = await download.json(jsonUrl);
        const image = await download.image(imageUrl);
        if (!json || !image) {
            continue;
        }

        causes[address] = {
            image: image,
            tagline: `${json.tagline.toUpperCase()}!`
        };
    }
    
    return causes;
};