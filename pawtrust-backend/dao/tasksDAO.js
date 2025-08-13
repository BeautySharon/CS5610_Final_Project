import mongodb from "mongodb";
const { ObjectId } = mongodb;

let tasks;
let applications;

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

  static async deleteTask(taskId) {
    try {
      const _id = toObjId(taskId, "taskId");

      const del = await tasks.deleteOne({ _id });
      if (del.deletedCount === 0) {
        throw new Error("No task found with the given ID.");
      }

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

  static async setAcceptedSitter(taskId, sitterId) {
    const _id = toObjId(taskId, "taskId");
    await tasks.updateOne(
      { _id },
      {
        $set: {
          acceptedSitterId: toObjId(sitterId, "sitterId"),
          status: "assigned",
          updatedAt: new Date(),
        },
      }
    );
  }

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

  static async assertOwnerFinishedAndAccepted(taskId, ownerId) {
    const _id = toObjId(taskId, "taskId");
    const task = await tasks.findOne({ _id });
    if (!task) throw new Error("Task not found");

    const taskOwner = task.owner_id || task.ownerId;
    const taskOwnerHex =
      taskOwner && typeof taskOwner.toHexString === "function"
        ? taskOwner.toHexString()
        : String(taskOwner);
    const ownerHex = toObjId(ownerId, "ownerId").toHexString();

    if (taskOwnerHex !== ownerHex) throw new Error("Not your task");

    if (task.status !== "finished") throw new Error("Task is not finished");

    let accepted =
      task.acceptedSitterId || task.accepted_sitter_id || task.sitterId || null;

    if (!accepted) {
      const accApp = await applications.findOne({
        taskId: _id,
        status: "accepted",
      });
      if (accApp?.sitterId) {
        accepted = accApp.sitterId;

        await tasks.updateOne(
          { _id },
          { $set: { acceptedSitterId: toObjId(accepted, "sitterId") } }
        );
      }
    }

    if (!accepted) throw new Error("No accepted sitter");

    task.acceptedSitterId = accepted;
    return task;
  }
}
