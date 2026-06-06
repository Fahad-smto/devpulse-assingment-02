// src/modules/issues/issues.routes.ts
import express from 'express';
import { issueController } from './issues.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = express.Router();

router.get('/',     issueController.getAllIssues);                                          // GET  /api/issues          — public
router.get('/:id',  issueController.getSingleIssue);                                       // GET  /api/issues/:id      — public
router.post('/',    authenticate, issueController.createIssue);                            // POST /api/issues          — any logged-in user
router.patch('/:id', authenticate, issueController.updateIssue);                           // PATCH /api/issues/:id    — contributor (own) | maintainer (any)
router.delete('/:id', authenticate, authorize('maintainer'), issueController.deleteIssue); // DELETE /api/issues/:id   — maintainer only

export default router;
