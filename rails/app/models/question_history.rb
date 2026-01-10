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
#
class QuestionHistory < ApplicationRecord
  belongs_to :user
  belongs_to :course
  belongs_to :unit
  belongs_to :question
end
