# frozen_string_literal: true

module Student
  class AnalyticsService
    def initialize(user, type)
      @user = user
      @type = type
    end

    def call
      analytics_data
    end

    private

    def analytics_data
      case @type.presence || 'task_completion'
      when 'task_completion'
        task_completion
      when 'understanding_score'
        understanding_score
      when 'grade_average'
        grade_average
      when 'course_rank'
        course_rank
      when 'unit_rank'
        unit_rank
      when 'correct_rate_rank'
        correct_rate_rank
      else
        raise ArgumentError, "指定された分析タイプ（#{@type}）は存在しません。"
      end
    end

    def task_completion
      total_count = @user.tasks.count
      completed_count = @user.tasks.completed.count

      {
        completed_count: completed_count,
        total_count: total_count,
        completion_rate: calculate_completion_rate(completed_count, total_count)
      }
    end

    def understanding_score
      build_understanding_score
    end

    def grade_average
      {
        my_score: my_score,
        grade_average: grade_average
      }
    end

    def course_rank
      {
        rank: rank,
        total_users: total_users
      }
    end

    def unit_rank
      {
        rank: rank,
        total_users: total_users
      }
    end

    def correct_rate_rank
      {
        rankings: rankings
      }
    end

    def calculate_completion_rate(completed_count, total_count)
      return 0 if total_count.zero?

      (completed_count.to_f / total_count * 100).round(1)
    end

    def build_understanding_score
      question_histories = @user.question_histories.includes(:unit, course: :subject)
      subject_histories = question_histories.group_by { |history| history.course.subject }

      {
        subjects: subject_histories.map do |subject, subject_histories|
          course_histories = subject_histories.group_by(&:course)

          {
            subject_name: subject.name,
            courses: course_histories.map do |course, course_histories|
              unit_histories = course_histories.group_by(&:unit)

              {
                level_name: course.level_name,
                level_number: course.level_number,
                units: unit_histories.map do |unit, unit_histories|
                  {
                    unit_name: unit.unit_name,
                    score: calculate_score(unit_histories)
                  }
                end
              }
            end
          }
        end
      }
    end

    def calculate_score(histories)
      total_count = histories.size
      return 0 if total_count.zero?

      correct_count = histories.count(&:is_correct)
      (correct_count.to_f / total_count * 100).round(1)
    end
  end
end
