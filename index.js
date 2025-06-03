const { spawn } = require('child_process');

// ...existing code...
function onClick() {
    if (!spawn) {
        throw new Error('spawn is not initialized');
    }
    // ...existing code...
}