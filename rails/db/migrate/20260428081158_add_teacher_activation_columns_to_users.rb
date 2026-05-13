class AddTeacherActivationColumnsToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :password_reset_required, :boolean, default: false, null: false
    add_column :users, :activated_at, :datetime
  end
end
