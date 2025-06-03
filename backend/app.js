import express from 'express';
import morgan from 'morgan';
import connect from './db/db.js';
import userRoutes from './routes/user.route.js';
import projectRoutes from './routes/project.route.js';
import aiRoutes from './routes/ai.route.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// Connect to MongoDB database
connect(); 

const app = express();

// Enable CORS for all origins and methods
app.use(cors({ 
  origin: '*', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Parse JSON and URL-encoded data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// HTTP request logger
app.use(morgan('dev'));
// Parse cookies
app.use(cookieParser());

// Set secure headers for cross-origin isolation
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});
// Ignore favicon requests
app.use((req, res, next) => {
    if (req.url === '/favicon.ico') {
      res.status(204).end();
      return;
    }
    next();
  });
// Serve static files from public directory
app.use(express.static('public'));

// Handle CORS preflight requests
app.options('*', cors());

// Register API routes
app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/ai', aiRoutes);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

export default app;