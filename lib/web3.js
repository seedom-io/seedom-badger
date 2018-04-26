const Web3 = require('web3');
const moment = require('moment-timezone');
const download = require('../lib/download');
const file = require('../lib/file');
const causesResolver = require('@seedom-io/seedom-resolver/causes');

module.exports.fundraisers = (config) => {
    const fundraisers = {};
    // loop over all networks
    for (const networkName in config.networks) {
        const deployment = config.deployments[networkName];
        if (!('fundraiser' in deployment)) {
            continue;
        }

        fundraisers[networkName] = {};
        // setup web3 (to latest fundraiser contract)
        const network = config.networks[networkName];
        const web3 = new Web3(network.url);
        // gather all fundraiser releases
        for (const release of deployment.fundraiser) {
            fundraisers[networkName][release.address]
                = new web3.eth.Contract(release.abi, release.address);
        }
    }

    return fundraisers;
};

module.exports.deployments = async (fundraisers) => {
    const deployments = {};
    // loop over all networks
    for (const networkName in fundraisers) {
        deployments[networkName] = {};
        const releases = fundraisers[networkName];
        // loop over last 6 contracts to execute call
        for (const address in releases) {
            const fundraiser = releases[address];
            let deployment;

            try {
                // attempt to get deployment
                deployment = await fundraiser.methods.deployment().call();
            } catch (error) {
                console.log(error);
                continue;
            }

            const endTime = moment(deployment._endTime * 1000).tz('America/New_York');
            deployments[networkName][address] = {
                cause: deployment._cause,
                endTime: {
                    top: endTime.format('LL'),
                    bottom: endTime.format('ha z')
                }
            };
        }
    }

    return deployments;
};

module.exports.causes = async (deployments, url) => {
    const causes = {};
    // loop over all networks
    for (const networkName in deployments) {
        causes[networkName] = {};
        const releases = deployments[networkName];
        // loop over last 6 contracts
        for (const address in releases) {
            const deployment = releases[address];
            const imageUrl = causesResolver.getImageUrl(deployment.cause);
            const jsonUrl = causesResolver.getJsonUrl(deployment.cause);
            const json = await download.json(jsonUrl);
            const image = await download.image(imageUrl);
            // make sure we have both
            if (!json || !image) {
                continue;
            }

            causes[networkName][address] = {
                image: image,
                tagline: `${json.tagline.toUpperCase()}!`
            };
        }
    }
    
    return causes;
};