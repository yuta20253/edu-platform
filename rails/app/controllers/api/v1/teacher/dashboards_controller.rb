# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class DashboardsController < Api::V1::Teacher::BaseController
        def show
          # 利用している所属高校の生徒数
          grade_counts = students
                         .high_school_current
                         .group('grades.year')
                         .count

          # お知らせ(教師向け5件くらい)
          announcements = Announcement
                          .for_user(current_user)
                          .published
                          .order(published_at: :desc)
                          .limit(5)

          # 昨日学習した生徒数(高１〜３年生のみ)

          render json: {
            stats: {
              # 利用している所属高校の生徒数(高１〜３年生のみ)
              grade_one_students_count: grade_counts[1] || 0,
              grade_two_students_count: grade_counts[2] || 0,
              grade_three_students_count: grade_counts[3] || 0
            },
            announcements: announcements
          }, status: :ok
        end

        private

        def students
          current_user.high_school.users
        end
      end
    end
  end
end
