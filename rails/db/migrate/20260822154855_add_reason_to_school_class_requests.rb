# frozen_string_literal: true

class AddReasonToSchoolClassRequests < ActiveRecord::Migration[7.2]
  def change
    add_column :school_class_requests, :reason, :text
  end
end
