import { ObjectId } from "mongodb";
import ReviewsDAO from "../dao/reviewsDAO.js";
import TasksDAO from "../dao/tasksDAO.js";

export default class ReviewsController {
  // POST /pawtrust/reviews
  static async apiCreateReview(req, res) {
    try {
      const { taskId, rating, comment, ownerId } = req.body;

      if (![taskId, ownerId, rating].every(Boolean)) {
        return res.status(400).json({ error: "Missing fields" });
      }
      if (
        !ObjectId.isValid(String(taskId)) ||
        !ObjectId.isValid(String(ownerId))
      ) {
        return res.status(400).json({ error: "Invalid ObjectId" });
      }
      const r = Number(rating);
      if (Number.isNaN(r) || r < 1 || r > 5) {
        return res.status(400).json({ error: "Rating must be 1-5" });
      }

      const task = await TasksDAO.assertOwnerFinishedAndAccepted(
        taskId,
        ownerId
      );

      const existed = await ReviewsDAO.getReviewByTask(taskId);
      if (existed) return res.status(409).json({ error: "Already reviewed" });

      const review = await ReviewsDAO.addReview({
        taskId,
        sitterId: task.acceptedSitterId,
        ownerId,
        rating: r,
        comment: comment || "",
      });

      await TasksDAO.setTaskReviewed(taskId, r);

      return res.json({ success: true, review });
    } catch (e) {
      console.error("[apiCreateReview] error:", e);

      const msg = String(e?.message || e);
      if (msg === "Task not found") return res.status(404).json({ error: msg });
      if (msg === "Not your task") return res.status(403).json({ error: msg });
      if (msg === "Task is not finished")
        return res.status(400).json({ error: msg });
      if (msg === "No accepted sitter")
        return res.status(400).json({ error: msg });

      return res.status(500).json({ error: "Server error" });
    }
  }

  // GET /pawtrust/reviews/sitter/:sitterId
  static async apiGetSitterReviews(req, res) {
    try {
      const { sitterId } = req.params;
      if (!ObjectId.isValid(String(sitterId))) {
        return res.status(400).json({ error: "Invalid sitterId" });
      }

      const list = await ReviewsDAO.getReviewsBySitter(sitterId);
      const avg =
        list.length === 0
          ? 0
          : Math.round(
              (list.reduce((s, x) => s + (Number(x.rating) || 0), 0) /
                list.length) *
                10
            ) / 10;

      return res.json({ reviews: list, avgRating: avg, count: list.length });
    } catch (e) {
      console.error("[apiGetSitterReviews] error:", e);
      return res.status(500).json({ error: "Server error" });
    }
  }

  // GET /pawtrust/reviews/task/:taskId
  static async apiGetReviewByTask(req, res) {
    try {
      const { taskId } = req.params;
      if (!ObjectId.isValid(String(taskId))) {
        return res.status(400).json({ error: "Invalid taskId" });
      }
      const r = await ReviewsDAO.getReviewByTask(taskId);
      return res.json(r || null);
    } catch (e) {
      console.error("[apiGetReviewByTask] error:", e);
      return res.status(500).json({ error: "Server error" });
    }
  }
}
