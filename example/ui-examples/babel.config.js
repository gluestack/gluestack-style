const myBabel = require('../../packages/babel-plugin-styled-resolver/src/index.js');
const path = require('path');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // modules: false,
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            // For development, we want to alias the library to the source
            ['@gluestack-style/react']: path.join(
              __dirname,
              '../../packages/react/src'
            ),
            ['@gluestack-style/animation-resolver']: path.join(
              __dirname,
              '../../packages/animation-resolver/src'
            ),
            ['@gluestack-style/legend-motion-animation-driver']: path.join(
              __dirname,
              '../../packages/animation-legend-motion-driver/src'
            ),
            ['@gluestack-ui/themed']: path.join(
              __dirname,
              '../../../gluestack-ui/packages/themed'
            ),
            // ['@gluestack-style/animation-plugin']: path.join(
            //   __dirname,
            //   '../../packages/animation-plugin/src'
            // ),
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
      ],
      // '@babel/plugin-transform-runtime',
      // '@babel/plugin-transform-modules-commonjs',
      [
        myBabel,
        // {
        //   configPath: path.join(__dirname, './gluestack-ui.config.ts'),
        //   configThemePath: ['theme'],
        //   styled: [
        //     '@gluestack-style/react',
        //     path.join(__dirname, '../../packages/react/src'),
        //   ],
        //   components: ['@gluesatck-ui/themed'],
        // },
      ],
    ],
  };
};
