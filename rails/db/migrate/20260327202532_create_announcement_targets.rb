class CreateAnnouncementTargets < ActiveRecord::Migration[7.1]
  def change
    create_table :announcement_targets do |t|
      t.references :announcement, null: false, foreign_key: true
      t.references :user_role, foreign_key: true
      t.references :grade, foreign_key: true
      t.references :high_school, foreign_key: true
      t.references :user, foreign_key: true

      t.timestamps
    end
  end
end
