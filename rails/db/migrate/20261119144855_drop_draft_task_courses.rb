class DropDraftTaskCourses < ActiveRecord::Migration[8.0]
  def change
    drop_table :draft_task_courses do |t|
      t.references :draft_task, null: false, foreign_key: true
      t.references :course, null: false, foreign_key: true

      t.timestamps
    end
  end
end
