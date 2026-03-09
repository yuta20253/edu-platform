class CreateGrades < ActiveRecord::Migration[7.1]
  def change
    create_table :grades do |t|
      t.references :high_school, null: false, foreign_key: true
      t.integer :year, null: false
      t.timestamps
    end

    add_index :grades, [:high_school_id, :year], unique: true
  end
end
