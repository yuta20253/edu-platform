# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class TeacherNotificationResultsController < Api::V1::Teacher::BaseController
        def index
          teacher_notifications = TeacherNotification
                                  .includes(:sender_user, :receiver_user)
                                  .joins(:sender_user)
                                  .where(
                                    users: { high_school_id: current_user.high_school_id }
                                  )
                                  .sent_on(params[:sent_at])
                                  .order(sent_at: :desc)

          render json: teacher_notifications,
                 each_serializer: ::Teacher::TeacherNotificationSerializer,
                 status: :ok
        end
      end
    end
  end
end
