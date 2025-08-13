// import ReviewsDAO from "../dao/reviewsDAO.js";

// export default class ReviewsController {
//   static async apiGetReviews(req, res) {
//     const reviews = await ReviewsDAO.getReview();
//     res.json(reviews);
//   }
//   static async apiPostReview(req, res, next) {
//     try {
//       const movieId = req.body.movie_id;
//       const review = req.body.review;
//       const userInfo = {
//         name: req.body.name,
//         _id: req.body.user_id,
//       };
//       const date = new Date();
//       const reviewResponse = await ReviewsDAO.addReview(
//         movieId,
//         userInfo,
//         review,
//         date
//       );

//       var { error } = reviewResponse;

//       if (error) {
//         res.status(500).json({ error: "Unable to post review." });
//       } else {
//         res.json({
//           status: "success",
//           response: reviewResponse,
//         });
//       }
//     } catch (e) {
//       res.status(500).json({ error: e });
//     }
//   }
//   static async apiUpdateReview(req, res, next) {
//     try {
//       const reviewId = req.body.review_id;
//       const review = req.body.review;
//       const userInfo = { _id: req.body.user_id };
//       const date = new Date();

//       const updateResponse = await ReviewsDAO.updateReview(
//         reviewId,
//         userInfo,
//         review,
//         date
//       );

//       if (updateResponse.modifiedCount === 0) {
//         throw new Error(
//           "No review was updated. Possibly wrong user_id or review_id."
//         );
//       }

//       res.json({ status: "success" });
//     } catch (e) {
//       console.error(`Unable to update review: ${e}`);
//       res.status(500).json({ error: e.message });
//     }
//   }

//   static async apiDeleteReview(req, res, next) {
//     try {
//       const reviewId = req.body.review_id;
//       const userId = req.body.user_id;

//       const deleteResponse = await ReviewsDAO.deleteReview(reviewId, userId);

//       if (deleteResponse.deletedCount === 0) {
//         throw new Error(
//           "No review was deleted. Possibly wrong user_id or review_id."
//         );
//       }

//       res.json({ status: "success" });
//     } catch (e) {
//       console.error(`Unable to delete review: ${e}`);
//       res.status(500).json({ error: e.message });
//     }
//   }
// }
// api/reviews.controller.js
// api/reviews.controller.js
import { ObjectId } from "mongodb";
import ReviewsDAO from "../dao/reviewsDAO.js";
import TasksDAO from "../dao/tasksDAO.js";

export default class ReviewsController {
  // POST /pawtrust/reviews
  static async apiCreateReview(req, res) {
    try {
      const { taskId, rating, comment, ownerId } = req.body;

      // 基本校验
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

      // 1) 任务断言：必须是当前 owner、自身任务已完成、且有 acceptedSitterId
      const task = await TasksDAO.assertOwnerFinishedAndAccepted(
        taskId,
        ownerId
      );
      // 这里的断言方法需要保证：若没有 acceptedSitterId，应抛出 "No accepted sitter"

      // 2) 防重复：同 task 只能评价一次
      const existed = await ReviewsDAO.getReviewByTask(taskId);
      if (existed) return res.status(409).json({ error: "Already reviewed" });

      // 3) 写入 review
      const review = await ReviewsDAO.addReview({
        taskId,
        sitterId: task.acceptedSitterId, // 由断言保证存在
        ownerId,
        rating: r,
        comment: comment || "",
      });

      // 4) 标记任务已评价（可冗余保存评分，便于任务列表展示）
      await TasksDAO.setTaskReviewed(taskId, r);

      return res.json({ success: true, review });
    } catch (e) {
      // 服务端控制台打印真实错误，方便定位
      console.error("[apiCreateReview] error:", e);

      const msg = String(e?.message || e);
      if (msg === "Task not found") return res.status(404).json({ error: msg });
      if (msg === "Not your task") return res.status(403).json({ error: msg });
      if (msg === "Task is not finished")
        return res.status(400).json({ error: msg });
      if (msg === "No accepted sitter")
        return res.status(400).json({ error: msg });

      // 兜底
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
