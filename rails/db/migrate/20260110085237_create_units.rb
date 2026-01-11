class CreateUnits < ActiveRecord::Migration[7.1]
  def change
    create_table :units do |t|
      t.references :course, null: false, foreign_key: true
      t.string :unit_name, null: false
      t.datetime :deleted_at

      t.timestamps
    end
  end
end
