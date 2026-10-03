# frozen_string_literal: true

# == Schema Information
#
# Table name: study_logs
#
#  id               :bigint           not null, primary key
#  user_id          :bigint           not null
#  task_id          :bigint           not null
#  started_at       :datetime         not null
#  ended_at         :datetime
#  duration_minutes :integer
#  deleted_at       :datetime
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  unit_id          :bigint           not null
#  status           :integer          default(0), not null
#
require 'rails_helper'

RSpec.describe StudyLog, type: :model do
  def create_study_log(**attrs)
    user = create(:user)
    create(:study_log, user: user, task: create(:task, user: user), **attrs)
  end

  describe '.active' do
    it '論理削除されていない学習ログのみ返す' do
      active_log = create_study_log
      create_study_log(deleted_at: Time.current)

      expect(described_class.active).to contain_exactly(active_log)
    end
  end
end
