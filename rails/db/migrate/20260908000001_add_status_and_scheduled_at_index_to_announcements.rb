# frozen_string_literal: true

class AddStatusAndScheduledAtIndexToAnnouncements < ActiveRecord::Migration[7.2]
  def change
    add_index :announcements, %i[status scheduled_at]
  end
end
