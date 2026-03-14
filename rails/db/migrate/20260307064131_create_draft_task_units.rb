class CreateDraftTaskUnits < ActiveRecord::Migration[7.1]
  def change
    create_table :draft_task_units do |t|
      t.references :draft_task, null: false, foreign_key: true
      t.references :unit, null: false, foreign_key: true
      t.timestamps
    end
    add_index :draft_task_units, [:draft_task_id, :unit_id], unique: true
  end
end
