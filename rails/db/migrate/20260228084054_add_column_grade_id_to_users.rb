class AddColumnGradeIdToUsers < ActiveRecord::Migration[7.1]
  def change
    add_reference :users, :grade, foreign_key: true
  end
end
