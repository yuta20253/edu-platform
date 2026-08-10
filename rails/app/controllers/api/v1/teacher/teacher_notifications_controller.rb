# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class TeacherNotificationsController < Api::V1::Teacher::BaseController
        before_action :require_manage_other_teachers!, only: :create

        def index
          unsent_teachers = base_teachers_scope

          render json: unsent_teachers,
                 each_serializer: ::Teacher::UnsentTeacherSerializer,
                 status: :ok
        end

        def create
          ::Teacher::TeacherNotificationSenderService.new(
            user: current_user,
            teacher_ids: target_teachers_ids
          ).call

          render json: { message: '送信処理を開始しました' }, status: :accepted
        end

        private

        def teacher_notification_params
          params.permit(teacher_ids: [])
        end

        def target_teachers_ids
          base_teachers_scope
            .where(id: teacher_notification_params[:teacher_ids])
            .ids
        end

        def base_teachers_scope
          User
            .by_high_school(current_user.high_school_id)
            .teachers
            .invitation_pending
        end

        def render_forbidden_error(message)
          render json: { errors: [message] }, status: :forbidden
        end

        def require_manage_other_teachers!
          return if current_user.teacher_permission&.manage_other_teachers?

          render_forbidden_error('他教員を招待する権限がありません')
        end
      end
    end
  end
end
