import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', AuditController.getMyLogs);

export default router;
