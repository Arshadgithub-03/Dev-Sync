const express = require('express');
const app = express();

// Add these headers to enable cross-origin isolation
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    next();
});

// ...existing code...
app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running...');
});