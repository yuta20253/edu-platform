class CreateUserUnits < ActiveRecord::Migration[7.1]
  def change
    create_table :user_units do |t|
      t.references :user, null: false, foreign_key: true
      t.references :unit, null: false, foreign_key: true
      t.integer :progress, default: 0
      t.datetime :completed_at

      t.timestamps
    end
    add_index :user_units, [:user_id, :unit_id], unique: true
  end
end
