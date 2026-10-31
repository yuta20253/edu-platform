# frozen_string_literal: true

# == Schema Information
#
# Table name: announcement_targets
#
#  id              :bigint           not null, primary key
#  announcement_id :bigint           not null
#  user_role_id    :bigint
#  grade_id        :bigint
#  high_school_id  :bigint
#  user_id         :bigint
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  target_type     :integer          default("all_users"), not null
#
require 'rails_helper'

RSpec.describe AnnouncementTarget, type: :model do
  describe 'indexes' do
    it 'target_type と high_school_id の複合インデックスが存在する' do
      expect(ActiveRecord::Base.connection.index_exists?(:announcement_targets, %i[target_type high_school_id]))
        .to be true
    end
  end
end
