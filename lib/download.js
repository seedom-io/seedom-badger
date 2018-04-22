const request = require('request');
const { Image } = require('canvas');

const getRandomInt = () => Math.floor(Math.random() * Math.floor(1000000000));

module.exports.file = (url, encoding) => {
    // randomize url as to not cache
    url = `${url}?${getRandomInt()}`;
    return new Promise((accept, reject) => {
        // download background image
        request({
            url,
            encoding
        }, (error, response, body) => {
            if (error) {
                reject(error);
                return;
            }
            accept(body);
        });
    });
};

module.exports.image = async (url) => {
    const buffer = await this.file(url, null);
    const image = new Image();
    image.src = buffer;
    return image;
};

module.exports.json = async (url) => {
    const json = await this.file(url, 'utf8');
    try {
        return JSON.parse(json);
    } catch (error) {
        return null;
    }
};