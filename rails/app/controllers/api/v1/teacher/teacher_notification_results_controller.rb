# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class TeacherNotificationResultsController < Api::V1::Teacher::BaseController
        def index
          teacher_notifications = TeacherNotification
                                  .includes(:sender_user, :receiver_user)
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
