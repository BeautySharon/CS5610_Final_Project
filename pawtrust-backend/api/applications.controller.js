import ApplicationsDAO from "../dao/applicationsDAO.js";

export default class ApplicationsController {
  static async apiGetApplications(req, res) {
    const applications = await ApplicationsDAO.getApplications();
    res.json(applications);
  }

  static async apiApplyToTask(req, res) {
    try {
      const { taskId, sitterId, message, status, createdAt } = req.body;

      if (!taskId || !sitterId) {
        return res.status(400).json({ error: "Missing taskId or sitterId" });
      }

      const result = await ApplicationsDAO.applyToTask({
        taskId,
        sitterId,
        message,
        status,
        createdAt,
      });

      if (result.insertedId) {
        res
          .status(201)
          .json({ success: true, applicationId: result.insertedId });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (e) {
      console.error("apiApplyToTask error:", e);
      res.status(500).json({ error: e.message });
    }
  }
  static async apiGetApplicationsBySitterId(req, res) {
    try {
      const sitterId = req.params.sitterId;
      const apps = await ApplicationsDAO.getApplicationsBySitterId(sitterId);
      res.json(apps);
    } catch (e) {
      console.error("❌ Failed to get sitter applications:", e);
      res.status(500).json({ error: e.message });
    }
  }
  static async apiAcceptApplication(req, res) {
    try {
      const { applicationId, taskId } = req.body;
      const result = await ApplicationsDAO.acceptApplication(
        applicationId,
        taskId
      );

      if (result.success) {
        res.status(200).json({ success: true });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (e) {
      console.error("Accept application error:", e);
      res.status(500).json({ error: e.message });
    }
  }
}
