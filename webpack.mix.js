const mix = require('laravel-mix');
const webpack = require('webpack');

// Asegura que todos los paths en el manifest y webpack sean relativos a `public`
mix.setPublicPath('public');

mix
  .js('resources/js/app.js', 'js')
  .sass('resources/sass/app.scss', 'css', {
    implementation: require('sass'),
    sassOptions: {
      // Silencia las advertencias provenientes de dependencias (node_modules)
      quietDeps: true
    }
  })
  .options({ processCssUrls: false })
  .sourceMaps(!mix.inProduction());

// Inyectar flags de Vue y alias para permitir templates en tiempo de ejecución
mix.webpackConfig({
  output: {
    // Dejar que Mix gestione la `filename` (evita dobles prefijos) y forzar que los chunks se emitan en `public/js`
    publicPath: '/',
    chunkFilename: 'js/[name].js'
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm-bundler.js'
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      __VUE_OPTIONS_API__: JSON.stringify(true),
      __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false)
    })
  ]
});

// Para Vue 3 (si surge la necesidad, añade .vue({ version: 3 }) y las dependencias necesarias)
