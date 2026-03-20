class ChangeHighSchoolsPrefectureNullable < ActiveRecord::Migration[7.1]
  def change
    change_column_null :high_schools, :prefecture_id, true
  end
end
