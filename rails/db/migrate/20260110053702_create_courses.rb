class CreateCourses < ActiveRecord::Migration[7.1]
  def change
    create_table :courses do |t|
      t.references :subject, null: true
      t.integer :level_number, null: false, default: 1
      t.string :level_name, null: false
      t.text :description, null: true
      t.datetime :deleted_at

      t.timestamps
    end
  end
end
