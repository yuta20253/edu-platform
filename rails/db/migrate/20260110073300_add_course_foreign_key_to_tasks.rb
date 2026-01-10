class AddCourseForeignKeyToTasks < ActiveRecord::Migration[7.1]
  def change
    add_foreign_key :tasks, :courses
  end
end
