# frozen_string_literal: true

module Student
  class TodayAnswerCountKey
    def self.build(user)
      "student:today_answer_count:#{user.id}:#{Time.current.to_date.iso8601}"
    end
  end
end
