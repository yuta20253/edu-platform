class AddTaskToQuestionHistories < ActiveRecord::Migration[7.1]
  def change
    add_reference :question_histories, :task, null: false, foreign_key: true
  end
end
