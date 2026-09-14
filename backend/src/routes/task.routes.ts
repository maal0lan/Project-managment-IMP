import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createTaskSchema, updateTaskSchema } from '../validators';

const router = Router();

// All task routes require authentication
router.use(authenticate);

router.get('/', TaskController.getAll);
router.get('/:id', TaskController.getById);
router.post('/', validateRequest(createTaskSchema), TaskController.create);
router.put('/:id', validateRequest(updateTaskSchema), TaskController.update);
router.delete('/:id', TaskController.delete);

export default router;
