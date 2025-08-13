import mongodb from "mongodb";
const { ObjectId } = mongodb;

let tasks;
let applications;

/** 统一安全转换为 ObjectId；传非法值时抛出明确错误 */
const toObjId = (v, name = "id") => {
  const s = String(v);
  if (!ObjectId.isValid(s)) throw new Error(`Invalid ObjectId for ${name}`);
  return new ObjectId(s);
};

export default class TasksDAO {
  static async injectDB(conn) {
    if (!tasks) {
      tasks = await conn.db(process.env.PawTrust_db).collection("tasks");
    }
    // ✅ 注入 applications，用于兜底推导 accepted sitter
    if (!applications) {
      applications = await conn
        .db(process.env.PawTrust_db)
        .collection("applications");
    }
  }

  static async getTasks({ filters = null, page = 0, tasksPerPage = 20 } = {}) {
    let query = {};
    if (filters?.petType) query.petType = { $eq: filters.petType };
    if (filters?.owner_id)
      query.owner_id = toObjId(filters.owner_id, "owner_id");

    try {
      const cursor = await tasks
        .find(query)
        .limit(tasksPerPage)
        .skip(tasksPerPage * page);

      const tasksList = await cursor.toArray();
      const totalNumTasks = await tasks.countDocuments(query);
      return { tasksList, totalNumTasks };
    } catch (e) {
      console.error(`Unable to fetch tasks: ${e}`);
      return { tasksList: [], totalNumTasks: 0 };
    }
  }

  static async getTasksByOwnerId(ownerId) {
    try {
      return await tasks
        .find({ owner_id: toObjId(ownerId, "ownerId") })
        .toArray();
    } catch (e) {
      console.error(`Unable to get tasks by ownerId: ${e}`);
      throw e;
    }
  }

  static async getAvailableTasks() {
    try {
      return await tasks.find({ status: "open" }).toArray();
    } catch (e) {
      console.error("Error fetching available tasks:", e);
      return [];
    }
  }

  static async addTask(taskData) {
    try {
      const taskDoc = {
        petType: taskData.petType,
        description: taskData.description,
        date: new Date(taskData.date),
        duration: taskData.duration,
        location: taskData.location,
        status: "open",
        createdAt: new Date(),
        owner_id: toObjId(taskData.owner_id, "owner_id"),
      };
      return await tasks.insertOne(taskDoc);
    } catch (e) {
      console.error("Error adding task:", e);
      return { error: e };
    }
  }

  static async updateTask(taskId, data) {
    try {
      const _id = toObjId(taskId, "taskId");
      const updateResult = await tasks.updateOne({ _id }, { $set: data });
      if (updateResult.modifiedCount === 0) {
        throw new Error("No task found with the given ID.");
      }
      return await tasks.findOne({ _id });
    } catch (e) {
      throw new Error(`Error updating task: ${e.message}`);
    }
  }

  // static async deleteTask(taskId) {
  //   try {
  //     const _id = toObjId(taskId, "taskId");
  //     const del = await tasks.deleteOne({ _id });
  //     if (del.deletedCount === 0)
  //       throw new Error("No task found with the given ID.");
  //     return { message: "Task deleted successfully." };
  //   } catch (e) {
  //     throw new Error(`Error deleting task: ${e.message}`);
  //   }
  // }
  static async deleteTask(taskId) {
    try {
      const _id = toObjId(taskId, "taskId");

      // 先删除任务
      const del = await tasks.deleteOne({ _id });
      if (del.deletedCount === 0) {
        throw new Error("No task found with the given ID.");
      }

      // 任务确实被删除后，再清理所有关联的申请
      // 你的 applications 表里用的是 { taskId: ObjectId(...) }（从 assertOwnerFinishedAndAccepted 可见）
      await applications.deleteMany({ taskId: _id });

      return { message: "Task and related applications deleted successfully." };
    } catch (e) {
      throw new Error(`Error deleting task: ${e.message}`);
    }
  }
  static async updateTaskStatus(taskId, status) {
    try {
      const _id = toObjId(taskId, "taskId");
      return await tasks.updateOne({ _id }, { $set: { status } });
    } catch (e) {
      console.error("Error updating task status:", e);
      return { error: e };
    }
  }

  static async getTaskById(taskId) {
    try {
      if (!ObjectId.isValid(String(taskId))) {
        console.error("Invalid taskId format:", taskId);
        return null;
      }
      return await tasks.findOne({ _id: new ObjectId(String(taskId)) });
    } catch (e) {
      console.error("Error fetching task by ID:", e);
      return null;
    }
  }

  /** 接受申请后写回任务上的 acceptedSitterId（供 /accept 调用） */
  static async setAcceptedSitter(taskId, sitterId) {
    const _id = toObjId(taskId, "taskId");
    await tasks.updateOne(
      { _id },
      {
        $set: {
          acceptedSitterId: toObjId(sitterId, "sitterId"),
          status: "assigned", // 看你业务，保留或去掉均可
          updatedAt: new Date(),
        },
      }
    );
  }

  /** 留评后标记任务已评价 */
  static async setTaskReviewed(taskId, rating) {
    const _id = toObjId(taskId, "taskId");
    await tasks.updateOne(
      { _id },
      {
        $set: {
          reviewed: true,
          rating: Number(rating) || 0,
          updatedAt: new Date(),
        },
      }
    );
  }

  /**
   * 断言：任务存在、属于该 owner、status === 'finished'，
   * 且存在已接受保姆；若任务上没有，则从 applications 兜底推导，并写回。
   */
  static async assertOwnerFinishedAndAccepted(taskId, ownerId) {
    const _id = toObjId(taskId, "taskId");
    const task = await tasks.findOne({ _id });
    if (!task) throw new Error("Task not found");

    // 兼容 owner_id / ownerId，使用十六进制字符串稳妥比较
    const taskOwner = task.owner_id || task.ownerId;
    const taskOwnerHex =
      taskOwner && typeof taskOwner.toHexString === "function"
        ? taskOwner.toHexString()
        : String(taskOwner);
    const ownerHex = toObjId(ownerId, "ownerId").toHexString();

    if (taskOwnerHex !== ownerHex) throw new Error("Not your task");

    if (task.status !== "finished") throw new Error("Task is not finished");

    // 1) 直接从任务取
    let accepted =
      task.acceptedSitterId || task.accepted_sitter_id || task.sitterId || null;

    // 2) 没有就从 applications 兜底找一条 accepted 的申请
    if (!accepted) {
      const accApp = await applications.findOne({
        taskId: _id,
        status: "accepted",
      });
      if (accApp?.sitterId) {
        accepted = accApp.sitterId;
        // 顺手写回任务，避免下次再查 applications
        await tasks.updateOne(
          { _id },
          { $set: { acceptedSitterId: toObjId(accepted, "sitterId") } }
        );
      }
    }

    if (!accepted) throw new Error("No accepted sitter");

    task.acceptedSitterId = accepted; // 统一给调用方使用
    return task;
  }
}
