module.exports.string = (bytes) => {
    const bytesMeat = bytes.substr(2);
    const buffer = Buffer.from(bytesMeat, 'hex');
    return buffer.toString().replace(/\0/g, '');
};