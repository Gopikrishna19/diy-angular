const packageName = require('./package.json').name;

module.exports = {
    entry: './index',
    module: {
        loaders: [
            {
                exclude: /node_modules/,
                loader: 'babel',
                test: /\.js/
            }
        ]
    },
    output: {
        filename: `${packageName}.js`,
        path: `${__dirname}/dist`
    }
};
