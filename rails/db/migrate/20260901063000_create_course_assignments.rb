# frozen_string_literal: true

class CreateCourseAssignments < ActiveRecord::Migration[7.2]
  def change
    create_table :course_assignments do |t|
      t.references :high_school, null: false, foreign_key: true
      t.references :course, null: false, foreign_key: true

      t.timestamps
    end

    add_index :course_assignments, %i[high_school_id course_id], unique: true
  end
end
