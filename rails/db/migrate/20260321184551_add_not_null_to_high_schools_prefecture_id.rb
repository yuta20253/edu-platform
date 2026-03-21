class AddNotNullToHighSchoolsPrefectureId < ActiveRecord::Migration[7.1]
  def change
    change_column_null :high_schools, :prefecture_id, false
  end
end
