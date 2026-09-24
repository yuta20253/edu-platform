# frozen_string_literal: true

class CreateImportedStudents < ActiveRecord::Migration[7.1]
  def change
    create_table :imported_students do |t|
      t.references :import_history, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.integer :action, null: false

      t.timestamps
    end

    add_index :imported_students, [:import_history_id, :user_id], unique: true
  end
end
