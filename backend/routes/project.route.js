import { Router } from 'express';
import { body } from 'express-validator';
import * as projectController from '../controllers/project.controller.js';
import * as authMiddleWare from '../middleware/auth.middleware.js'

// Create a router for project-related routes
const router = Router();

// Route to create a new project (protected)
router.post('/create',
  authMiddleWare.authUser,
  body('name')
    .isString().withMessage('Name must be string')
    .isLength({ min: 3 }).withMessage('Name must be at least 3 characters')
    .trim(),
  projectController.createProject
);

// Route to get all projects for the logged-in user (protected)
router.get('/all',
    authMiddleWare.authUser,
    projectController.getAllProject
)

// Route to add users to a project (protected)
router.put('/add-user',
    authMiddleWare.authUser,
    body('projectId').isString().withMessage('Project ID is required'),
    body('users').isArray({ min: 1 }).withMessage('User must be an array of strings').bail()
        .custom((users) => users.every(user => typeof user === 'string')).withMessage('Each User must be a string'),
    projectController.addUsersToProject
)

// Route to remove a user from a project (protected)
router.put('/remove-user',
    authMiddleWare.authUser,
    body('projectId').isString().withMessage('Project ID is required'),
    body('userId').isString().withMessage('User ID is required'),
    projectController.removeUserFromProject
)

// Route to get a project by its ID (protected)
router.get('/get-project/:projectId',
    authMiddleWare.authUser,
    projectController.getProjectById
)

// Route to update the file tree of a project (protected)
router.put('/update-file-tree',
    authMiddleWare.authUser,
    body('projectId').isString().withMessage('Project ID is required'),
    body('fileTree').isObject().withMessage('File Tree is required'),
    projectController.updateFileTree
)

// Route to save a message in a project (protected)
router.post('/save-message',
    authMiddleWare.authUser,
    body('projectId').isString(),
    body('sender').isObject(),
    body('message').isString(),
    projectController.saveMessage
);

router.delete(
  '/:projectId',
  authMiddleWare.authUser,
  projectController.deleteProject
);

export default router;