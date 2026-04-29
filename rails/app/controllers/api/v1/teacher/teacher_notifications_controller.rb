# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class TeacherNotificationsController < Api::V1::Teacher::BaseController
        def index
          unsent_teachers = base_teachers_scope

          render json: unsent_teachers
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
      end
    end
  end
end
