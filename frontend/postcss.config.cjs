// PostCSS configuration for Tailwind and autoprefixer
module.exports = {
    plugins: {
      // Import plugin, but filter out Tailwind's own imports
      'postcss-import': {
        filter: (path) => !path.includes('node_modules/tailwindcss')
      },
      // Tailwind CSS plugin
      tailwindcss: {},
      // Autoprefixer for vendor prefixes
      autoprefixer: {},
    }
  }