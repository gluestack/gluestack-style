const path = require('path');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      process.env.NODE_ENV !== 'production'
        ? [
            'module-resolver',
            {
              alias: {
                // For development, we want to alias the library to the source
                ['@gluestack-style/react']: path.join(
                  __dirname,
                  '../../packages/react/src'
                ),
                ['@gluestack-style/legend-motion-animation-driver']: path.join(
                  __dirname,
                  '../../packages/animation-legend-motion-driver/src'
                ),
                ['@gluestack-style/moti-driver']: path.join(
                  __dirname,
                  '../../packages/animation-moti-animation-driver/src'
                ),
                ['@gluestack-style/animation-resolver']: path.join(
                  __dirname,
                  '../../packages/animation-resolver/src'
                ),
                // ['@dank-style/react']: path.join(
                //   __dirname,
                //   '../../packages/react/src'
                // ),
                // ['@gluestack-style/animation-plugin']: path.join(
                //   __dirname,
                //   '../../packages/animation-plugin/src'
                // ),
                // ['@dank-style/animation-plugin']: path.join(
                //   __dirname,
                //   '../../packages/animation-plugin/src'
                // ),
              },
            },
          ]
        : ['babel-plugin-react-docgen-typescript', { exclude: 'node_modules' }],
      '@babel/plugin-transform-modules-commonjs',
    ],
  };
};
