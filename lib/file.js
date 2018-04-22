const fs = require('mz/fs');
const path = require('path');

module.exports.readJson = async (file) => {
    const resolvedFile = path.resolve(process.cwd(), file);
    const json = await fs.readFile(resolvedFile, 'utf8');
    return JSON.parse(json);
};