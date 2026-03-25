# frozen_string_literal: true

module Api
  module V1
    module Admin
      class DashboardsController < BaseController
        def show
          role_counts = User.joins(:user_role).group("user_roles.name").count
          recent_imports = ImportHistory.order(created_at: :desc).limit(5)

          render json: {
            stats: {
              student_count: role_counts["student"] || 0,
              teacher_count: role_counts["teacher"] || 0,
              admin_count: role_counts["admin"] || 0,
              total_questions: Question.count
            },
            recent_imports: ActiveModelSerializers::SerializableResource.new(recent_imports, each_serializer: ImportHistorySerializer)
          }
        end
      end
    end
  end
end
