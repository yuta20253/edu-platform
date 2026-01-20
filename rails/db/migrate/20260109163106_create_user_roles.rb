class CreateUserRoles < ActiveRecord::Migration[7.1]
  def change
    create_table :user_roles do |t|
      t.string :role_name, null: false

      t.timestamps
    end

    add_index :user_roles, :role_name, unique: true
  end
end
