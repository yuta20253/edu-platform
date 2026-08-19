class AddColumnsToHighSchool < ActiveRecord::Migration[7.2]
  def change
    add_column :high_schools, :school_code, :string
    add_column :high_schools, :csv_managed, :boolean, null: false, default: false

    add_index :high_schools, :school_code, unique: true
  end
end
