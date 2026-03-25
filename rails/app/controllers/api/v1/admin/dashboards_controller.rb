# frozen_string_literal: true

module Api
  module V1
    module Admin
      class DashboardsController < BaseController
        def show
          role_counts = User.joins(:user_role).group("user_roles.name").count

          render json: {
            stats: {
              student_count: role_counts["student"] || 0,
              teacher_count: role_counts["teacher"] || 0,
              admin_count: role_counts["admin"] || 0,
              total_questions: Question.count
            },
            recent_imports: recent_imports
          }
        end

        private

        def recent_imports
          ImportHistory.order(created_at: :desc).limit(5).map do |h|
            {
              id: h.id,
              file_name: h.file_name,
              status: h.status,
              success_count: h.success_count,
              error_count: h.error_count,
              total_count: h.total_count,
              created_at: h.created_at
            }
          end
        end
      end
    end
  end
end
