const fs = require('fs');
const loader = require('../seedom-solidity/chronicle/loader');

const writeJsonFile = (file, obj) => {
    fs.writeFileSync(file, JSON.stringify(obj, null, 4), 'utf8');
};

writeJsonFile('./networks.json', loader.getNetworks());
writeJsonFile('./deployments.json', loader.getDeployments());