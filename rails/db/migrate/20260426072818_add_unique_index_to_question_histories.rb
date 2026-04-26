class AddUniqueIndexToQuestionHistories < ActiveRecord::Migration[7.1]
  def change
    add_index :question_histories,
      [:user_id, :task_id, :unit_id, :question_id],
      unique: true,
      name: "idx_question_histories_unique_answer"
  end
end
