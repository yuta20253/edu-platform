class CreateTaskUnits < ActiveRecord::Migration[7.1]
  def change
    create_table :task_units do |t|
      t.references :task, null: false, foreign_key: true
      t.references :unit, null: false, foreign_key: true

      t.timestamps
    end
    add_index :task_units, [:task_id, :unit_id], unique: true
  end
end
