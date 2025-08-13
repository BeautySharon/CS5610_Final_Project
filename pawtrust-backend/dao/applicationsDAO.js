import mongodb from "mongodb";
const ObjectId = mongodb.ObjectId;

let applications;

export default class ApplicationsDAO {
  static async injectDB(conn) {
    if (applications) return;
    try {
      applications = await conn
        .db(process.env.PawTrust_db)
        .collection("applications");
    } catch (e) {
      console.error(`Unable to connect to applicationsDAO: ${e}`);
    }
  }
  static async getApplications() {
    try {
      return await applications.find().toArray();
    } catch (e) {
      console.error("Failed to get applications:", e);
      return [];
    }
  }
  static async applyToTask({ taskId, sitterId, message, status, createdAt }) {
    try {
      if (!ObjectId.isValid(taskId) || !ObjectId.isValid(sitterId)) {
        throw new Error("Invalid taskId or sitterId");
      }

      const appDoc = {
        taskId: new ObjectId(taskId),
        sitterId: new ObjectId(sitterId),
        message,
        status: status || "pending",
        createdAt: new Date(createdAt),
      };

      const result = await applications.insertOne(appDoc);
      return result;
    } catch (e) {
      console.error("Error applying to task:", e);
      return { error: e.message || e.toString() };
    }
  }
  static async getApplicationsBySitterId(sitterId) {
    try {
      return await applications
        .find({ sitterId: new ObjectId(sitterId) })
        .toArray();
    } catch (e) {
      console.error("Failed to get applications for sitter:", e);
      return [];
    }
  }
  static async acceptApplication(applicationId, taskId) {
    try {
      const tasks = await (await import("./tasksDAO.js")).default;

      const task = await tasks.getTaskById(taskId);
      if (!task) {
        return { error: "Task not found" };
      }

      if (task.status !== "open") {
        return { error: "Task is not open" };
      }

      await applications.updateOne(
        { _id: new ObjectId(applicationId) },
        { $set: { status: "accepted" } }
      );

      await tasks.updateTaskStatus(taskId, "pending");

      return { success: true };
    } catch (e) {
      console.error("Failed to accept application:", e);
      return { error: e.message };
    }
  }
}
