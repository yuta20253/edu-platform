class CreateTaskCourses < ActiveRecord::Migration[7.1]
  def change
    create_table :task_courses do |t|
      t.references :task, null: false, foreign_key: true
      t.references :course, null: false, foreign_key: true

      t.timestamps
    end
  end
end
