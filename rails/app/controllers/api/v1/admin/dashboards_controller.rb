# frozen_string_literal: true

module Api
  module V1
    module Admin
      class DashboardsController < BaseController
        def show
          render json: {
            stats: {
              student_count: count_by_role(:student),
              teacher_count: count_by_role(:teacher),
              admin_count:   count_by_role(:admin),
              total_questions: Question.count
            },
            recent_imports: recent_imports
          }
        end

        private

        def count_by_role(role)
          User.joins(:user_role)
              .where(user_roles: { name: UserRole.names[role] })
              .count
        end

        def recent_imports
          ImportHistory.order(created_at: :desc).limit(5).map do |h|
            {
              id:            h.id,
              file_name:     h.file_name,
              status:        h.status,
              success_count: h.success_count,
              error_count:   h.error_count,
              total_count:   h.total_count,
              created_at:    h.created_at
            }
          end
        end
      end
    end
  end
end
