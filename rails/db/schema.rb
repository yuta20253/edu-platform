# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2026_01_24_114802) do
  create_table "addresses", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "postal_code", limit: 8, null: false
    t.string "prefecture", limit: 20, null: false
    t.string "city", limit: 50, null: false
    t.string "town", limit: 50
    t.string "street_address", limit: 100
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "courses", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "subject_id"
    t.integer "level_number", default: 1, null: false
    t.string "level_name", null: false
    t.text "description"
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["subject_id"], name: "index_courses_on_subject_id"
  end

  create_table "goals", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "title", null: false
    t.text "description"
    t.date "due_date"
    t.integer "status", default: 0, null: false
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_goals_on_user_id"
  end

  create_table "high_schools", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "name", limit: 50, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_high_schools_on_name", unique: true
  end

  create_table "question_choices", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "question_id", null: false
    t.integer "choice_number"
    t.text "choice_text"
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["question_id"], name: "index_question_choices_on_question_id"
  end

  create_table "question_explanations", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "question_id", null: false
    t.string "explanation_type"
    t.text "explanation_text"
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["explanation_type"], name: "index_question_explanations_on_explanation_type"
    t.index ["question_id"], name: "index_question_explanations_on_question_id"
  end

  create_table "question_hints", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "question_id", null: false
    t.integer "step_number"
    t.text "hint_text"
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["question_id", "step_number"], name: "index_question_hints_unique_step", unique: true
    t.index ["question_id"], name: "index_question_hints_on_question_id"
  end

  create_table "question_histories", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "course_id", null: false
    t.bigint "unit_id", null: false
    t.bigint "question_id", null: false
    t.bigint "question_choice_id", null: false
    t.text "answer_text"
    t.integer "time_spent_sec"
    t.boolean "is_correct", default: false, null: false
    t.boolean "explanation_viewed", default: false, null: false
    t.datetime "answered_at", null: false
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["course_id"], name: "index_question_histories_on_course_id"
    t.index ["question_choice_id"], name: "index_question_histories_on_question_choice_id"
    t.index ["question_id"], name: "index_question_histories_on_question_id"
    t.index ["unit_id"], name: "index_question_histories_on_unit_id"
    t.index ["user_id", "answered_at"], name: "index_question_histories_on_user_id_and_answered_at"
    t.index ["user_id", "course_id"], name: "index_question_histories_on_user_id_and_course_id"
    t.index ["user_id", "is_correct"], name: "index_question_histories_on_user_id_and_is_correct"
    t.index ["user_id", "question_id"], name: "index_question_histories_on_user_id_and_question_id"
    t.index ["user_id"], name: "index_question_histories_on_user_id"
  end

  create_table "questions", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "unit_id", null: false
    t.text "question_text", null: false
    t.text "correct_answer", null: false
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["unit_id"], name: "index_questions_on_unit_id"
  end

  create_table "reflections", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "course_id", null: false
    t.text "note_text", null: false
    t.date "entry_date", null: false
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["course_id"], name: "index_reflections_on_course_id"
    t.index ["user_id"], name: "index_reflections_on_user_id"
  end

  create_table "review_question_choices", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "review_question_id", null: false
    t.integer "choice_number", null: false
    t.text "choice_text", null: false
    t.boolean "is_correct", null: false
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["review_question_id"], name: "index_review_question_choices_on_review_question_id"
  end

  create_table "review_questions", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "review_test_id", null: false
    t.text "title", null: false
    t.text "correct_answer", null: false
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["review_test_id"], name: "index_review_questions_on_review_test_id"
  end

  create_table "review_tests", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "course_id", null: false
    t.string "text_name", null: false
    t.text "description", null: false
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["course_id"], name: "index_review_tests_on_course_id"
  end

  create_table "study_logs", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "task_id", null: false
    t.datetime "started_at", null: false
    t.datetime "ended_at"
    t.integer "duration_minutes"
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["task_id"], name: "index_study_logs_on_task_id"
    t.index ["user_id"], name: "index_study_logs_on_user_id"
  end

  create_table "subjects", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "task_courses", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "task_id", null: false
    t.bigint "course_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["course_id"], name: "index_task_courses_on_course_id"
    t.index ["task_id"], name: "index_task_courses_on_task_id"
  end

  create_table "task_units", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "task_id", null: false
    t.bigint "unit_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["task_id", "unit_id"], name: "index_task_units_on_task_id_and_unit_id", unique: true
    t.index ["task_id"], name: "index_task_units_on_task_id"
    t.index ["unit_id"], name: "index_task_units_on_unit_id"
  end

  create_table "tasks", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "goal_id"
    t.string "title", limit: 100, null: false
    t.text "content", null: false
    t.integer "priority", default: 3, null: false
    t.date "due_date"
    t.integer "estimated_time"
    t.integer "status", default: 0, null: false
    t.text "memo"
    t.datetime "completed_at"
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["goal_id"], name: "index_tasks_on_goal_id"
    t.index ["user_id"], name: "index_tasks_on_user_id"
  end

  create_table "units", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "course_id", null: false
    t.string "unit_name", null: false
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["course_id"], name: "index_units_on_course_id"
  end

  create_table "user_overall_question_stats", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.integer "total_questions", default: 0, null: false
    t.integer "correct_questions", default: 0, null: false
    t.integer "total_time_sec", default: 0, null: false
    t.decimal "accuracy_rate", precision: 5, scale: 2, default: "0.0", null: false
    t.decimal "avg_time_sec", precision: 6, scale: 2, default: "0.0", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_user_overall_question_stats_on_user_id", unique: true
  end

  create_table "user_personal_infos", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "phone_number"
    t.date "birthday"
    t.integer "gender"
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_user_personal_infos_on_user_id"
  end

  create_table "user_roles", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.integer "name", default: 1, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_user_roles_on_name", unique: true
  end

  create_table "user_subject_question_stats", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "subject_id", null: false
    t.integer "total_questions"
    t.integer "correct_questions"
    t.integer "total_time_sec"
    t.decimal "accuracy_rate", precision: 10
    t.decimal "avg_time_sec", precision: 10
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["subject_id"], name: "index_user_subject_question_stats_on_subject_id"
    t.index ["user_id", "subject_id"], name: "index_user_subject_question_stats_on_user_id_and_subject_id", unique: true
    t.index ["user_id"], name: "index_user_subject_question_stats_on_user_id"
  end

  create_table "user_unit_question_stats", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "course_id", null: false
    t.bigint "unit_id", null: false
    t.integer "total_questions"
    t.integer "correct_questions"
    t.integer "total_time_sec"
    t.decimal "accuracy_rate", precision: 10
    t.decimal "avg_time_sec", precision: 10
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["course_id"], name: "index_user_unit_question_stats_on_course_id"
    t.index ["unit_id"], name: "index_user_unit_question_stats_on_unit_id"
    t.index ["user_id", "course_id", "unit_id"], name: "index_user_unit_stats_unique", unique: true
    t.index ["user_id"], name: "index_user_unit_question_stats_on_user_id"
  end

  create_table "users", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "email", null: false
    t.string "encrypted_password", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.string "name", limit: 100
    t.string "name_kana", limit: 100
    t.bigint "user_role_id"
    t.string "jti", null: false
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "high_school_id"
    t.bigint "address_id"
    t.index ["address_id"], name: "index_users_on_address_id"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["high_school_id"], name: "index_users_on_high_school_id"
    t.index ["jti"], name: "index_users_on_jti", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["user_role_id"], name: "index_users_on_user_role_id"
  end

  add_foreign_key "goals", "users"
  add_foreign_key "question_choices", "questions"
  add_foreign_key "question_explanations", "questions"
  add_foreign_key "question_hints", "questions"
  add_foreign_key "question_histories", "courses"
  add_foreign_key "question_histories", "question_choices"
  add_foreign_key "question_histories", "questions"
  add_foreign_key "question_histories", "units"
  add_foreign_key "question_histories", "users"
  add_foreign_key "questions", "units"
  add_foreign_key "reflections", "courses"
  add_foreign_key "reflections", "users"
  add_foreign_key "review_question_choices", "review_questions"
  add_foreign_key "review_questions", "review_tests"
  add_foreign_key "review_tests", "courses"
  add_foreign_key "study_logs", "tasks"
  add_foreign_key "study_logs", "users"
  add_foreign_key "task_courses", "courses"
  add_foreign_key "task_courses", "tasks"
  add_foreign_key "task_units", "tasks"
  add_foreign_key "task_units", "units"
  add_foreign_key "tasks", "goals"
  add_foreign_key "tasks", "users"
  add_foreign_key "units", "courses"
  add_foreign_key "user_overall_question_stats", "users"
  add_foreign_key "user_personal_infos", "users"
  add_foreign_key "user_subject_question_stats", "subjects"
  add_foreign_key "user_subject_question_stats", "users"
  add_foreign_key "user_unit_question_stats", "courses"
  add_foreign_key "user_unit_question_stats", "units"
  add_foreign_key "user_unit_question_stats", "users"
  add_foreign_key "users", "addresses"
  add_foreign_key "users", "high_schools"
  add_foreign_key "users", "user_roles"
end
