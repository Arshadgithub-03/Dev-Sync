import projectModel from '../models/project.model.js'
import mongoose from 'mongoose'

// Create a new project with the given name and admin
export const createProject = async ({ name, admin }) => {
    if (!name) {
        throw new Error('Name is required');
    }
    if (!admin || !admin._id) {
        throw new Error('Admin details are required');
    }

    let project;
    try {
        project = await projectModel.create({
            name,
            admin, // Store admin details in the project
            users: [admin._id], // Admin should be part of users
            fileTree: {}, // Initialize file tree
        });
    } catch (error) {
        if (error.code == 11000) {
            throw new Error('Project name already exists');
        }
        throw error;
    }

    return project;
};

// Get all projects for a specific user
export const getAllProjectByUserId = async ({ userId }) => {
    if (!userId) {
        throw new Error('UserId is required')
    }

    const allUserProjects = await projectModel.find({
        users: userId
    })

    return allUserProjects
}

// Add users to a project
export const addUsersToProject = async ({ projectId, users, userId }) => {

    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    if (!users) {
        throw new Error("users are required") 
    }

    if (!Array.isArray(users) || users.some(userId =>
        !mongoose.Types.ObjectId.isValid(userId))) {
        throw new Error("Invalid userId(s) in users array")
    }

    if (!userId) {
        throw new Error("userId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid userId")
    }

    const project = await projectModel.findOne({
        _id: projectId,
        users: userId
    })

    if (!project) {
        throw new Error("User not belong to this project")
    }

    const updatedProject = await projectModel.findOneAndUpdate({
        _id: projectId
    }, {
        $addToSet: {
            users: {
                $each: users
            }
        }
    }, {
        new: true
    })

    return updatedProject
}

// Get project details by project ID
export const getProjectById = async ({ projectId })  => {

    if(!projectId) {
        throw new Error ("projectId is required")
    }

    if(!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error ("Invalid projectId")
    }

    const project = await projectModel.findOne({
        _id: projectId
    }).populate('users')

    return project
}

// Update the file tree of a project
export const updateFileTree = async ({ projectId, fileTree }) => {
    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    if (!fileTree) {
        throw new Error("fileTree is required")
    }

    const updatedProject = await projectModel.findOneAndUpdate({
        _id: projectId
    }, {
        fileTree
    }, {
        new: true
    })

    return updatedProject
}

// Delete a project by project ID
export const deleteProject = async ({ projectId, userId }) => {
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Valid projectId is required");
  }
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Valid userId is required");
  }

  // Only the admin can delete the project
  const project = await projectModel.findOne({ _id: projectId });
  if (!project) {
    throw new Error("Project not found");
  }
  if (project.admin._id.toString() !== userId.toString()) {
    throw new Error("Only the project admin can delete this project");
  }

  // Delete the project
  await projectModel.deleteOne({ _id: projectId });
  return { success: true };
};

// Remove a user from a project (admin only, cannot remove admin)
export const removeUserFromProject = async ({ projectId, userId, adminId }) => {
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Valid projectId is required");
    }
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Valid userId is required");
    }
    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
        throw new Error("Valid adminId is required");
    }
    const project = await projectModel.findOne({ _id: projectId });
    if (!project) {
        throw new Error("Project not found");
    }
    if (project.admin._id.toString() !== adminId.toString()) {
        throw new Error("Only the project admin can remove collaborators");
    }
    if (userId === project.admin._id.toString()) {
        throw new Error("Cannot remove the admin from the project");
    }
    const updatedProject = await projectModel.findOneAndUpdate(
        { _id: projectId },
        { $pull: { users: userId } },
        { new: true }
    ).populate('users');
    return updatedProject;
};