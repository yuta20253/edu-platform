class AddPrefectureToHighSchools < ActiveRecord::Migration[7.1]
  def change
    unless column_exists?(:high_schools, :prefecture_id)
      add_reference :high_schools, :prefecture, null: true, foreign_key: true
    end
  end
end
