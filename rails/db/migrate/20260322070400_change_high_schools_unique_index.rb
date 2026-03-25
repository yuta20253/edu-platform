class ChangeHighSchoolsUniqueIndex < ActiveRecord::Migration[7.1]
  def change
    remove_index :high_schools, :name
    add_index :high_schools, [:name, :prefecture_id], unique: true
  end
end
