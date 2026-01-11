class CreateTasks < ActiveRecord::Migration[7.1]
  def change
    create_table :tasks do |t|
      t.references :user, null: false, foreign_key: true
      t.references :goal, null: true, foreign_key: true
      t.references :course, null: true

      t.string :title, null: false, limit: 100
      t.text :content, null: false
      t.integer :priority, null: false, default: 3
      t.date :due_date
      t.integer :estimated_time
      t.integer :status, null: false, default: 0
      t.text :memo
      t.datetime :completed_at
      t.datetime :deleted_at

      t.timestamps
    end
  end
end
