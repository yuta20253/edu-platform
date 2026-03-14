class CreateDraftTaskCourses < ActiveRecord::Migration[7.1]
  def change
    create_table :draft_task_courses do |t|
      t.references :draft_task, null: false, foreign_key: true
      t.references :course, null: false, foreign_key: true

      t.timestamps
    end
  end
end
