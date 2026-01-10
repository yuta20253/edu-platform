class RemoveCourseIdFromTasks < ActiveRecord::Migration[7.1]
  def change
    remove_reference :tasks, :course, null: false, foreign_key: true
  end
end
