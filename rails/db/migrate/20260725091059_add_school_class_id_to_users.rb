class AddSchoolClassIdToUsers < ActiveRecord::Migration[7.1]
  def change
    add_reference :users, :school_class, null: true, foreign_key: true
  end
end
