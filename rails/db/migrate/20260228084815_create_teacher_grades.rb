class CreateTeacherGrades < ActiveRecord::Migration[7.1]
  def change
    create_table :teacher_grades do |t|
      t.references :user, null: false, foreign_key: true
      t.references :grade, null: false, foreign_key: true

      t.timestamps
    end

    add_index :teacher_grades, [:user_id, :grade_id], unique: true
  end
end
