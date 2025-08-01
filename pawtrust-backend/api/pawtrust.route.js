import express from "express";
import TasksController from "./tasks.controller.js";
import UsersController from "./users.controller.js";
import ReviewsController from "./reviews.controller.js";
import ApplicationsController from "./applications.controller.js";

const router = express.Router();

router.route("/tasks").get(TasksController.apiGetTasks);
// In tasks.route.js
router
  .route("/tasks/owner/:owner_id")
  .get(TasksController.apiGetTasksByOwnerId);
router.route("/tasks/available").get(TasksController.apiGetAvailableTasks);
router.route("/tasks/list/:_id").get(TasksController.apiGetTasksByTaskId);
router.route("/tasks").post(TasksController.apiPostTask);
router.route("/tasks/:id").put(TasksController.apiUpdateTask);
router.route("/tasks/:id").delete(TasksController.apiDeleteTask);

router.route("/login").post(UsersController.apiLogin);
router.route("/register").post(UsersController.apiRegister);
router.route("/sitters").get(UsersController.apiGetUsersByType);

router.route("/test").get((req, res) => {
  res.json({ message: "POST /test reached!" });
});

router.route("/applications").get(ApplicationsController.apiGetApplications);
router.route("/applications/apply").post(ApplicationsController.apiApplyToTask);
router
  .route("/applications/sitter/:sitterId")
  .get(ApplicationsController.apiGetApplicationsBySitterId);
router.route("/accept").post(ApplicationsController.apiAcceptApplication);

router.route("/reviews").get(ReviewsController.apiGetReviews);
router.route("/reviews").post(ReviewsController.apiPostReview);
router.route("/reviews").put(ReviewsController.apiUpdateReview);
router.route("/reviews").delete(ReviewsController.apiDeleteReview);

export default router;
