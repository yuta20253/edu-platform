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
        subject_histories = subject_histories.sort_by { |subject, _histories| subject.id }

        {
          subjects: subject_histories.map { |subject, histories| build_subject_data(subject, histories) }
        }
      end

      def build_subject_data(subject, histories)
        course_histories = histories.group_by(&:course)

        {
          subject_name: subject.name,
          courses: course_histories.map { |course, histories| build_course_data(course, histories) }
        }
      end

      def build_course_data(course, histories)
        unit_histories = histories.group_by(&:unit)

        {
          level_name: course.level_name,
          level_number: course.level_number,
          units: unit_histories.map { |unit, histories| build_unit_data(unit, histories) }
        }
      end

      def build_unit_data(unit, histories)
        {
          unit_name: unit.unit_name,
          score: Calculator.correct_rate(histories)
        }
      end
    end
  end
end
