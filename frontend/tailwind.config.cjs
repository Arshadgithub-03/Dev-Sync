// Tailwind CSS configuration
module.exports = {
    // Specify files to scan for Tailwind class usage
    content: [
      "./index.html",
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    // Core plugins configuration (uncomment to disable preflight if needed)
    corePlugins: {
      // preflight: false, // Uncomment to disable Tailwind's base styles
    },
    // Theme customization
    theme: {
      extend: {}, // Extend default theme here
    },
    // Add custom plugins here
    plugins: [],
  }