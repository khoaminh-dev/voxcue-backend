const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication middleware to all routes
router.use(requireAuth);

/**
 * GET /api/projects
 * List all projects for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        userId: req.user.uid
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/', async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        userId: req.user.uid
      }
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/projects/:id
 * Get a specific project and its audio files
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: req.user.uid
      },
      include: {
        audioFiles: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/projects/:id
 * Update a project
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        userId: req.user.uid
      }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingProject.title,
        description: description !== undefined ? description : existingProject.description
      }
    });

    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        userId: req.user.uid
      }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }

    await prisma.project.delete({
      where: { id }
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
