import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createProjectSchema, updateProjectSchema } from '../validators';

const router = Router();

// All project routes require authentication
router.use(authenticate);

router.get('/', ProjectController.getAll);
router.get('/:id', ProjectController.getById);
router.post('/', validateRequest(createProjectSchema), ProjectController.create);
router.put('/:id', validateRequest(updateProjectSchema), ProjectController.update);
router.delete('/:id', ProjectController.delete);

export default router;
