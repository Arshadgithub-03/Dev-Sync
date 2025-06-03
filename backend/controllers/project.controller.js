import projectModel from '../models/project.model.js'
import * as projectServices from '../services/project.service.js'
import userModel from '../models/user.model.js'
import { validationResult } from 'express-validator'
import mongoose from 'mongoose'

// Controller to create a new project
export const createProject = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name } = req.body;
        const loggedInUser = await userModel.findOne({ email: req.user.email });

        if (!loggedInUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const userId = loggedInUser._id;

        // Create admin object for the project
        const admin = {
            _id: userId,
            name: loggedInUser.name,
            email: loggedInUser.email
        };

        // Create the project using service
        const newProject = await projectServices.createProject({ name, admin });

        res.status(201).json(newProject);
    } catch (err) {
        console.log(err);
        res.status(400).send(err.message);
    }
};

// Controller to get all projects for the logged-in user
export const getAllProject = async (req, res) => {
    try {
        const loggedInUser = await userModel.findOne({
            email: req.user.email
        })

        const allUserProjects = await projectServices.getAllProjectByUserId({
            userId: loggedInUser._id
        })

        return res.status(200).json({
            projects: allUserProjects
        })

    }
    catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }
}

// Controller to add users to a project
export const addUsersToProject = async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return req.status(400).json({ errors: errors.array() })
    }

    try {
        const { projectId, users } = req.body

        const loggedInUser = await userModel.findOne({
            email: req.user.email

        })

        const project = await projectServices.addUsersToProject({
            projectId,
            users,
            userId: loggedInUser._id

        })

        return res.status(200).json({
            project,
        })
    }
    catch (err) {
        console.log(err)
        res.status(400).json({ errors: err.message })
    }
}

// Controller to get a project by its ID
export const getProjectById = async (req, res) => {
    const { projectId } = req.params;

    // ✅ Add validation
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ error: "Invalid project ID format" });
    }

    try {
        const project = await projectModel.findById(projectId)
            .populate('users')
            .lean();

        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        res.status(200).json({ project });
    } catch (err) {
        console.error("Error in getProjectById:", err);
        res.status(500).json({ error: "Server error" });
    }
}

// Controller to update the file tree of a project
export const updateFileTree = async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const { projectId, fileTree } = req.body

        const project = await projectServices.updateFileTree({
            projectId,
            fileTree
        })

        return res.status(200).json({
            project
        })
    }
    catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }
}

// Controller to save a message to a project
export const saveMessage = async (req, res) => {
    try {
        const { projectId, sender, message } = req.body;
        
        const project = await projectModel.findByIdAndUpdate(
            projectId,
            {
                $push: {
                    messages: {
                        sender,
                        message,
                        createdAt: new Date()
                    }
                }
            },
            { new: true }
        );

        res.status(200).json(project);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
};

// Controller to delete a project
export const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const loggedInUser = await userModel.findOne({ email: req.user.email });
    if (!loggedInUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const result = await projectServices.deleteProject({
      projectId,
      userId: loggedInUser._id
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Error in deleteProject:", err);
    const status = err.message.includes("only") || err.message.includes("required") ? 403 : 400;
    return res.status(status).json({ error: err.message });
  }
};

// Controller to remove a user from a project
export const removeUserFromProject = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Return a single error string for frontend consistency
        return res.status(400).json({ error: errors.array().map(e => e.msg).join(', ') });
    }
    try {
        const { projectId, userId } = req.body;
        const loggedInUser = await userModel.findOne({ email: req.user.email });
        if (!loggedInUser) {
            return res.status(404).json({ error: "User not found" });
        }
        let project;
        try {
            project = await projectServices.removeUserFromProject({
                projectId,
                userId,
                adminId: loggedInUser._id
            });
        } catch (err) {
            // Permission errors (admin only, cannot remove admin)
            if (err.message.includes('admin')) {
                return res.status(403).json({ error: err.message });
            }
            // Not found errors
            if (err.message.includes('not found')) {
                return res.status(404).json({ error: err.message });
            }
            // Other errors
            return res.status(400).json({ error: err.message });
        }
        return res.status(200).json({ project });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Internal server error" });
    }
};