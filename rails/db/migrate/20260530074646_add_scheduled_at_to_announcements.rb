class AddScheduledAtToAnnouncements < ActiveRecord::Migration[7.1]
  def change
    add_column :announcements, :scheduled_at, :datetime
  end
end
