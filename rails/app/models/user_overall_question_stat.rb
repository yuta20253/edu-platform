# frozen_string_literal: true

# == Schema Information
#
# Table name: user_overall_question_stats
#
#  id                :bigint           not null, primary key
#  user_id           :bigint           not null
#  total_questions   :integer          default(0), not null
#  correct_questions :integer          default(0), not null
#  total_time_sec    :integer          default(0), not null
#  accuracy_rate     :decimal(5, 2)    default(0.0), not null
#  avg_time_sec      :decimal(6, 2)    default(0.0), not null
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#
class UserOverallQuestionStat < ApplicationRecord
  belongs_to :user
end
