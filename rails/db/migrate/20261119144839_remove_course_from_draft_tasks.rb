class RemoveCourseFromDraftTasks < ActiveRecord::Migration[8.0]
  def change
    remove_reference :draft_tasks, :course, null: true, foreign_key: false
  end
end
