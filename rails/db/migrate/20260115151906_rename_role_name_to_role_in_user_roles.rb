class RenameRoleNameToRoleInUserRoles < ActiveRecord::Migration[7.1]
  def change
    rename_column :user_roles, :role_name, :name
  end
end
