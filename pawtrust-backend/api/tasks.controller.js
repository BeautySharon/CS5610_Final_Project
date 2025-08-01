// import TasksDAO from "../dao/tasksDAO.js";

// export default class TasksController {
//   static async apiGetTasks(req, res) {
//     const tasksPerPage = req.query.tasksPerPage
//       ? parseInt(req.query.tasksPerPage)
//       : 20;
//     const page = req.query.page ? parseInt(req.query.page) : 0;

//     let filters = {};
//     if (req.query.petType) {
//       filters.petType = req.query.petType;
//     }

//     const { tasksList, totalNumTasks } = await TasksDAO.getTasks({
//       filters,
//       page,
//       tasksPerPage,
//     });

//     res.json({
//       tasks: tasksList,
//       page,
//       filters,
//       entries_per_page: tasksPerPage,
//       total_results: totalNumTasks,
//     });
//   }

//   static async apiGetTaskById(req, res) {
//     try {
//       const id = req.params.id || {};
//       const task = await TasksDAO.getTaskById(id);
//       if (!task) {
//         res.status(404).json({ error: "not found" });
//         return;
//       }
//       res.json(task);
//     } catch (e) {
//       console.error(`API error: ${e}`);
//       res.status(500).json({ error: e });
//     }
//   }

//   static async apiPostTask(req, res) {
//     try {
//       const task = await TasksDAO.addTask(req.body);
//       res.status(201).json(task);
//     } catch (e) {
//       res.status(500).json({ error: e.message });
//     }
//   }
// }
import TasksDAO from "../dao/tasksDAO.js";
import { ObjectId } from "mongodb"; // ✅ Add this

export default class TasksController {
  static async apiGetTasks(req, res) {
    const tasksPerPage = req.query.tasksPerPage
      ? parseInt(req.query.tasksPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 0;

    let filters = {};
    if (req.query.petType) {
      filters.petType = req.query.petType;
    }
    if (req.query.owner) {
      filters.owner_id = req.query.owner;
    }

    try {
      const { tasksList, totalNumTasks } = await TasksDAO.getTasks({
        filters,
        page,
        tasksPerPage,
      });

      res.json({
        tasks: tasksList,
        page,
        filters,
        entries_per_page: tasksPerPage,
        total_results: totalNumTasks,
      });
    } catch (e) {
      console.error("Error in apiGetTasks:", e);
      res.status(500).json({ error: e.message });
    }
  }

  // In TasksController.js
  static async apiGetTasksByOwnerId(req, res) {
    try {
      const ownerId = req.params.owner_id;

      if (!ObjectId.isValid(ownerId)) {
        return res.status(400).json({ error: "Invalid ObjectId format" });
      }

      const tasks = await TasksDAO.getTasksByOwnerId(ownerId);

      if (!tasks || tasks.length === 0) {
        return res.status(404).json({ error: "No tasks found for this owner" });
      }

      res.json(tasks);
    } catch (e) {
      console.error(`API error: ${e}`);
      res.status(500).json({ error: e.message });
    }
  }
  static async apiGetAvailableTasks(req, res) {
    try {
      const taskList = await TasksDAO.getAvailableTasks();
      res.status(200).json(taskList);
    } catch (e) {
      console.error("Failed to get available tasks:", e);
      res.status(500).json({ error: e.message });
    }
  }
  // static async apiPostTask(req, res) {
  //   try {
  //     const task = await TasksDAO.addTask(req.body);
  //     res.status(201).json(task); // ✅ 返回完整文档
  //   } catch (e) {
  //     res.status(500).json({ error: e.message });
  //   }
  // }
  static async apiPostTask(req, res) {
    try {
      const taskData = req.body;

      const result = await TasksDAO.addTask(taskData);

      if (result.insertedId) {
        res.status(201).json({ success: true, task_id: result.insertedId });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (e) {
      console.error("Post task error:", e);
      res.status(500).json({ success: false, error: e.message });
    }
  }
  static async apiUpdateTask(req, res) {
    try {
      const taskId = req.params.id;
      const data = req.body;

      if (!ObjectId.isValid(taskId)) {
        return res.status(400).json({ error: "Invalid ObjectId format" });
      }

      const updatedTask = await TasksDAO.updateTask(taskId, data);
      res.json(updatedTask);
    } catch (e) {
      console.error(`API error: ${e}`);
      res.status(500).json({ error: e.message });
    }
  }

  static async apiDeleteTask(req, res) {
    try {
      const taskId = req.params.id;

      if (!ObjectId.isValid(taskId)) {
        return res.status(400).json({ error: "Invalid ObjectId format" });
      }

      const deleteResult = await TasksDAO.deleteTask(taskId);
      if (deleteResult.deletedCount === 0) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json({ message: "Task deleted successfully" });
    } catch (e) {
      console.error(`API error: ${e}`);
      res.status(500).json({ error: e.message });
    }
  }

  static async apiGetTasksByTaskId(req, res) {
    try {
      const id = req.params._id;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid ObjectId format" });
      }

      const tasks = await TasksDAO.getTaskById(id);

      if (!tasks || tasks.length === 0) {
        return res.status(404).json({ error: "No tasks found for this owner" });
      }

      res.json(tasks);
    } catch (e) {
      console.error(`API error: ${e}`);
      res.status(500).json({ error: e.message });
    }
  }
}
