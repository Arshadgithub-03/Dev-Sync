// Filter function to exclude Tailwind's own imports from postcss-import
module.exports = (id) => {
    // Exclude files from node_modules/tailwindcss
    return !id.includes('node_modules/tailwindcss')
}