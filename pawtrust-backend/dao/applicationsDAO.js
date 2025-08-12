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
      console.error("❌ Failed to get applications:", e);
      return [];
    }
  }
  static async applyToTask({ taskId, sitterId, message, status, createdAt }) {
    try {
      // 验证 ObjectId 格式
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
      console.error("❌ Failed to get applications for sitter:", e);
      return [];
    }
  }
  static async acceptApplication(applicationId, taskId) {
    try {
      const tasks = await (await import("./tasksDAO.js")).default;

      // Step 1: 检查 task 是否存在
      const task = await tasks.getTaskById(taskId);
      if (!task) {
        return { error: "Task not found" };
      }

      // Step 2: 确保当前任务状态为 open
      if (task.status !== "open") {
        return { error: "Task is not open" };
      }

      // Step 3: 更新申请状态为 accepted
      await applications.updateOne(
        { _id: new ObjectId(applicationId) },
        { $set: { status: "accepted" } }
      );

      // Step 4: 更新任务状态为 pending
      await tasks.updateTaskStatus(taskId, "pending");

      return { success: true };
    } catch (e) {
      console.error("Failed to accept application:", e);
      return { error: e.message };
    }
  }
  // static async getById(appId) {
  //   return applications.findOne({ _id: new ObjectId(appId) });
  // }
  // static async markAccepted(applicationId, taskId, sitterId) {
  //   // 接受当前申请
  //   await applications.updateOne(
  //     { _id: new ObjectId(applicationId) },
  //     { $set: { status: "accepted" } }
  //   );
  //   // 拒绝同任务的其它申请（可选）
  //   await applications.updateMany(
  //     {
  //       taskId: new ObjectId(taskId),
  //       _id: { $ne: new ObjectId(applicationId) },
  //     },
  //     { $set: { status: "rejected" } }
  //   );
  // }
}
