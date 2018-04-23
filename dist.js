const fs = require('fs');
const loader = require('../seedom-solidity/chronicle/loader');

const writeJsonFile = (file, obj) => {
    fs.writeFileSync(file, JSON.stringify(obj, null, 4), 'utf8');
};

writeJsonFile('./config/networks.json', loader.getNetworks());
writeJsonFile('./config/deployments.json', loader.getDeployments());