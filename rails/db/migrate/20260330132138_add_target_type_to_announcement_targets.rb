class AddTargetTypeToAnnouncementTargets < ActiveRecord::Migration[7.1]
  def change
    add_column :announcement_targets, :target_type, :integer, null: false, default: 0
  end
end
