'use strict';
const router = require('express').Router();
const DashboardController = require('../controllers/dashboard/DashboardController');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/stats',    authenticate, DashboardController.getStats.bind(DashboardController));
router.get('/activity', authenticate, DashboardController.getActivity.bind(DashboardController));
router.get('/alerts',   authenticate, DashboardController.getAlerts.bind(DashboardController));

module.exports = router;
