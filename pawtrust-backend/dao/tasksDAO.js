import mongodb from "mongodb";
const ObjectId = mongodb.ObjectId;

let tasks;

export default class TasksDAO {
  static async injectDB(conn) {
    if (tasks) return;
    try {
      tasks = await conn.db(process.env.PawTrust_db).collection("tasks");
    } catch (e) {
      console.error(`Unable to connect in TasksDAO: ${e}`);
    }
  }

  static async getTasks({ filters = null, page = 0, tasksPerPage = 20 } = {}) {
    let query = {};

    // ✅ 新增过滤逻辑：petType 或 owner_id
    if (filters?.petType) {
      query.petType = { $eq: filters.petType };
    }
    if (filters?.owner_id) {
      query.owner_id = new ObjectId(filters.owner_id);
    }

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
      return await tasks.find({ owner_id: new ObjectId(ownerId) }).toArray(); // ✅ 使用原样字符串
    } catch (e) {
      console.error(`Unable to get tasks by ownerId: ${e}`);
      throw e;
    }
  }

  static async getAvailableTasks() {
    try {
      const filter = { status: "open" };
      const cursor = await tasks.find(filter);
      const taskList = await cursor.toArray();
      return taskList;
    } catch (e) {
      console.error("Error fetching available tasks:", e);
      return [];
    }
  }

  // static async addTask(data) {
  //   try {
  //     const insertResult = await tasks.insertOne(data);
  //     const insertedTask = await tasks.findOne({
  //       _id: insertResult.insertedId,
  //     }); // ✅ 返回完整任务
  //     return insertedTask;
  //   } catch (e) {
  //     throw new Error(`Error inserting task: ${e.message}`);
  //   }
  // }
  static async addTask(taskData) {
    try {
      const taskDoc = {
        petType: taskData.petType,
        description: taskData.description,
        date: new Date(taskData.date),
        duration: taskData.duration,
        location: taskData.location,
        status: "open", // default
        createdAt: new Date(),
        owner_id: new ObjectId(taskData.owner_id),
      };

      const result = await tasks.insertOne(taskDoc);
      return result;
    } catch (e) {
      console.error("Error adding task:", e);
      return { error: e };
    }
  }

  static async updateTask(taskId, data) {
    try {
      const updateResult = await tasks.updateOne(
        { _id: new ObjectId(taskId) },
        { $set: data }
      );
      if (updateResult.modifiedCount === 0) {
        throw new Error("No task found with the given ID.");
      }
      return await tasks.findOne({ _id: new ObjectId(taskId) });
    } catch (e) {
      throw new Error(`Error updating task: ${e.message}`);
    }
  }
  static async deleteTask(taskId) {
    try {
      const deleteResult = await tasks.deleteOne({ _id: new ObjectId(taskId) });
      if (deleteResult.deletedCount === 0) {
        throw new Error("No task found with the given ID.");
      }
      return { message: "Task deleted successfully." };
    } catch (e) {
      throw new Error(`Error deleting task: ${e.message}`);
    }
  }
  static async updateTaskStatus(taskId, status) {
    try {
      const result = await tasks.updateOne(
        { _id: new ObjectId(taskId) },
        { $set: { status } }
      );
      return result;
    } catch (e) {
      console.error("Error updating task status:", e);
      return { error: e };
    }
  }
  static async getTaskById(taskId) {
    try {
      if (!ObjectId.isValid(taskId)) {
        console.error("Invalid taskId format:", taskId);
        return null;
      }

      return await tasks.findOne({ _id: new ObjectId(taskId) });
    } catch (e) {
      console.error("Error fetching task by ID:", e);
      return null;
    }
  }
}
