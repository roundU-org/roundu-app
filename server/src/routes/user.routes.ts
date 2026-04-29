import { Router } from 'express';
import { updateUser } from '../controllers/user.controller';

const router = Router();

router.put('/:id', updateUser);

export default router;
