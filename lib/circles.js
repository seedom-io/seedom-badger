module.exports.get = (d, w, h) => {
    const r = d / 2;
    return {
        r,
        x: (w / 2) - r,
        y: (h / 2) - r
    };
};