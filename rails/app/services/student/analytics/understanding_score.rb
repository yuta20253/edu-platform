# frozen_string_literal: true

module Student
  module Analytics
    class UnderstandingScore
      def initialize(user)
        @user = user
      end

      def call
        build_understanding_score
      end

      private

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
                      score: Calculator.correct_rate(unit_histories)
                    }
                  end
                }
              end
            }
          end
        }
      end
    end
  end
end
