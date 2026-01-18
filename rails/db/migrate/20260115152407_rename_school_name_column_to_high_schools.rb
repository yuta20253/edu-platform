class RenameSchoolNameColumnToHighSchools < ActiveRecord::Migration[7.1]
  def change
    rename_column :high_schools, :school_name, :name
  end
end
