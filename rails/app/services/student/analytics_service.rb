# frozen_string_literal: true

module Student
  class AnalyticsService
    def initialize(user, type, course_id: nil, unit_id: nil)
      @user = user
      @type = type
      @course_id = course_id
      @unit_id = unit_id
    end

    delegate :call, to: :analyzer

    private

    def analyzer
      case @type.presence || 'task_completion'
      when 'task_completion'
        Student::Analytics::TaskCompletion.call(@user)
      when 'understanding_score'
        Student::Analytics::UnderstandingScore.call(@user)
      when 'grade_average'
        Student::Analytics::GradeAverage.call(@user)
      when 'course_rank'
        Student::Analytics::Rank.call(@user, :course_id, @course_id)
      when 'unit_rank'
        Student::Analytics::Rank.call(@user, :unit_id, @unit_id)
      else
        raise ArgumentError, "指定された分析タイプ（#{@type}）は存在しません。"
      end
    end
  end
end
