# frozen_string_literal: true

# == Schema Information
#
# Table name: question_histories
#
#  id                 :bigint           not null, primary key
#  user_id            :bigint           not null
#  course_id          :bigint           not null
#  unit_id            :bigint           not null
#  question_id        :bigint           not null
#  question_choice_id :bigint           not null
#  answer_text        :text(65535)
#  time_spent_sec     :integer
#  is_correct         :boolean          default(FALSE), not null
#  explanation_viewed :boolean          default(FALSE), not null
#  answered_at        :datetime         not null
#  deleted_at         :datetime
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  task_id            :bigint           not null
#
require 'rails_helper'

RSpec.describe QuestionHistory, type: :model do
  def create_question_history(**attrs)
    user = create(:user)
    create(:question_history, user: user, task: create(:task, user: user), **attrs)
  end

  describe '.active' do
    it '論理削除されていない解答履歴のみ返す' do
      active_history = create_question_history
      create_question_history(deleted_at: Time.current)

      expect(described_class.active).to contain_exactly(active_history)
    end
  end
end
