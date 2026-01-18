class ChangeUserRolesNameToInteger < ActiveRecord::Migration[7.1]
  def up
    change_column :user_roles, :name, :integer, default: 1, null: false
  end

  def down
    change_column :user_roles, :name, :string
  end
end
