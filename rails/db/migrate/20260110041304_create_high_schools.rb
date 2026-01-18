class CreateHighSchools < ActiveRecord::Migration[7.1]
  def change
    create_table :high_schools do |t|
      t.string :school_name, limit: 50, null: false

      t.timestamps
    end

    add_index :high_schools, :school_name, unique: true
  end
end
