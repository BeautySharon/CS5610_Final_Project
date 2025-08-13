import TasksDAO from "../dao/tasksDAO.js";
import { ObjectId } from "mongodb";
import ApplicationsDAO from "../dao/applicationsDAO.js";

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
  //     res.status(201).json(task);
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

  static async updateTask(req, res) {
    try {
      const { taskId } = req.params;
      const ownerId = req.user?.id || req.body.owner_id;

      if (!ObjectId.isValid(taskId))
        return res.status(400).json({ error: "Invalid taskId" });
      if (!ownerId || !ObjectId.isValid(ownerId))
        return res.status(401).json({ error: "Unauthorized" });

      const task = await TasksDAO.getTaskById(taskId);
      if (!task) return res.status(404).json({ error: "Task not found" });
      if (String(task.owner_id) !== String(ownerId)) {
        return res.status(403).json({ error: "Not your task" });
      }

      const {
        petType,
        description,
        date,
        duration,
        location,
        status,
        __clear,
      } = req.body || {};
      const ALLOWED_STATUS = new Set([
        "open",
        "pending",
        "assigned",
        "accepted",
        "closed",
      ]);

      const allowed = {};
      if (petType !== undefined && String(petType).trim() !== "")
        allowed.petType = String(petType).trim();
      if (description !== undefined) allowed.description = description;
      if (date !== undefined && date !== "" && date !== null) {
        const d = new Date(date);
        if (!isNaN(d.getTime())) allowed.date = d.toISOString();
      }
      if (duration !== undefined && duration !== "" && duration !== null) {
        const n = Number(duration);
        if (!Number.isNaN(n)) allowed.duration = n;
      }
      if (location !== undefined && String(location).trim() !== "")
        allowed.location = String(location).trim();
      if (status !== undefined) {
        if (!ALLOWED_STATUS.has(status))
          return res.status(400).json({ error: "Invalid status" });
        allowed.status = status;
      }
      if (Array.isArray(__clear)) {
        for (const f of __clear) {
          if (["date", "location", "description"].includes(f))
            allowed[f] = null;
        }
      }

      if (!Object.keys(allowed).length)
        return res.json({ success: true, task });

      const updated = await TasksDAO.updateFieldsById(taskId, allowed);
      if (!updated) return res.status(404).json({ error: "Task not found" });

      return res.json({ success: true, task: updated });
    } catch (err) {
      console.error("updateTask error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  }
  // api/tasks.controller.js
  static async apiFinishTask(req, res) {
    try {
      const { taskId } = req.params;
      if (!ObjectId.isValid(taskId)) {
        return res.status(400).json({ error: "Invalid taskId" });
      }
      const updated = await TasksDAO.updateTaskStatus(taskId, "finished");
      if (!updated) return res.status(404).json({ error: "Task not found" });
      return res.json({ success: true, task: updated });
    } catch (e) {
      console.error("apiFinishTask error:", e);
      return res.status(500).json({ error: "Server error" });
    }
  }
}
