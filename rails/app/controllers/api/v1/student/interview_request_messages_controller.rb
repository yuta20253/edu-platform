# frozen_string_literal: true

module Api
  module V1
    module Student
      class InterviewRequestMessagesController < Api::V1::Student::BaseController
        def index
          messages = interview_request.interview_request_messages.includes(:sender).order(:created_at)
          render json: messages, each_serializer: InterviewRequestMessageSerializer, status: :ok
        end

        def create
          message = ::Student::CreateInterviewRequestMessageService.new(
            user: current_user,
            interview_request_id: params[:interview_request_id],
            body: create_message_params[:body]
          ).call

          render json: message, serializer: InterviewRequestMessageSerializer, status: :created
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
        end

        private

        def interview_request
          InterviewRequest.find_by!(id: params[:interview_request_id], student_id: current_user.id)
        end

        def create_message_params
          params.require(:interview_request_message).permit(:body)
        end
      end
    end
  end
end
