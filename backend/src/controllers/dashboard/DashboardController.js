'use strict';
const DashboardService = require('../../services/dashboard/DashboardService');

class DashboardController {
  async getStats(req, res, next) {
    try {
      const data = await DashboardService.getStats();
      res.json({ success: true, ...data });
    } catch (err) { next(err); }
  }

  async getActivity(req, res, next) {
    try {
      const items = await DashboardService.getActivity();
      res.json({ success: true, items });
    } catch (err) { next(err); }
  }

  async getAlerts(req, res, next) {
    try {
      const items = await DashboardService.getAlerts();
      res.json({ success: true, items });
    } catch (err) { next(err); }
  }
}

module.exports = new DashboardController();
