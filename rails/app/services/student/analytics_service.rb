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
      build_grade_average
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
                    score: calculate_correct_rate(unit_histories)
                  }
                end
              }
            end
          }
        end
      }
    end

    # メモ:
    # 引数には @user.question_histories のような Association と、
    # QuestionHistory.where(...) のような ActiveRecord::Relation の両方が渡される。
    # Association では Enumerable#count(&:is_correct) が使えるため共通メソッドとしている。
    def calculate_correct_rate(histories)
      total_count = histories.size
      return 0 if total_count.zero?

      correct_count = histories.count(&:is_correct)

      (correct_count.to_f / total_count * 100).round(1)
    end

    def build_grade_average
      {
        correct_rate: {
          my: calculate_correct_rate(@user.question_histories),
          average: average_correct_rate
        },
        task_completion_rate: {
          my: calculate_completion_rate(completed_count, total_count),
          average: average_task_completion_rate
        }
      }
    end

    # メモ:
    # 学年全体の集計は DB 上で集計した方が効率的。
    # calculate_correct_rate は Association を前提としているため、
    # ここでは SQL の count を利用して正答率を算出している。
    def average_correct_rate
      return 0 if grade_users.empty?

      histories = QuestionHistory.where(user_id: grade_users.select(:id))

      total_count = histories.count
      return 0 if total_count.zero?

      correct_count = histories.where(is_correct: true).count

      (correct_count.to_f / total_count * 100).round(1)
    end

    def average_task_completion_rate
      return 0 if grade_users.empty?

      tasks = Task.where(user_id: grade_users.select(:id))

      calculate_completion_rate(tasks.completed.count, tasks.count)
    end

    def completed_count
      @completed_count ||= @user.tasks.completed.count
    end

    def total_count
      @total_count ||= @user.tasks.count
    end

    def grade_users
      @grade_users ||= User.joins(:grade).where(grades: { year: @user.grade.year })
    end
  end
end
