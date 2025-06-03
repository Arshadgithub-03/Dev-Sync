import { Router } from "express";
import * as aiController from '../controllers/ai.controller.js'

// Create a router for AI-related routes
const router = Router();

// Route to get AI-generated result
router.get('/get-result', aiController.getResult)

export default router