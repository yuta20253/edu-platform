class AddForeignKeysToReviewTables < ActiveRecord::Migration[7.1]
  def change
    # review_tests -> courses
    add_foreign_key :review_tests, :courses

    # review_questions -> review_tests
    add_foreign_key :review_questions, :review_tests

    # review_question_choices -> review_questions
    add_foreign_key :review_question_choices, :review_questions
  end
end
