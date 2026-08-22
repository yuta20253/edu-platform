class AddLockVersionToSchoolClassRequests < ActiveRecord::Migration[7.2]
  def change
    add_column :school_class_requests, :lock_version, :integer, null: false, default: 0
  end
end
