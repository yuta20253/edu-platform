# frozen_string_literal: true

class AddLockVersionToTeacherPermissions < ActiveRecord::Migration[7.2]
  def change
    add_column :teacher_permissions, :lock_version, :integer, null: false, default: 0
  end
end
