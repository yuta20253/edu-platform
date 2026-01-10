class MakeUserRoleAndHighSchoolNullableInUsers < ActiveRecord::Migration[7.1]
  def change
    change_column_null :users, :user_role_id, true
    change_column_null :users, :high_school_id, true
  end
end
