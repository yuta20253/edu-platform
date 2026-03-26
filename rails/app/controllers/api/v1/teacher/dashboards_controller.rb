# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class DashboardsController < Api::V1::Teacher::BaseController
        def show
          # 利用している所属高校の生徒
          students = current_user.high_school.users

          # 利用している所属高校の生徒数(高１〜３年生のみ)
          grade_counts = students.joins(:grade).group('grades.year').count

          # お知らせ(直近10件くらい)

          # 昨日学習した生徒数(高１〜３年生のみ)

          render json: {
            grade_1: grade_counts[1] || 0,
            grade_2: grade_counts[2] || 0,
            grade_3: grade_counts[3] || 0
          }, status: :ok
        end
      end
    end
  end
end
