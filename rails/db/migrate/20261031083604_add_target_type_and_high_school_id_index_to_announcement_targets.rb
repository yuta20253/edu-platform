class AddTargetTypeAndHighSchoolIdIndexToAnnouncementTargets < ActiveRecord::Migration[7.2]
  def change
    add_index :announcement_targets, %i[target_type high_school_id]
  end
end
