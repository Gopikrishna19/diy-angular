const packageName = require('./package.json').name;

module.exports = {
    devtool: 'source-map',
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
        library: ['diyAngular'],
        path: `${__dirname}/dist`
    }
};
