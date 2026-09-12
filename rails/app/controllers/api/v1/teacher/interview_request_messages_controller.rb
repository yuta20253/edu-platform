# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class InterviewRequestMessagesController < Api::V1::Teacher::BaseController
        def index
          messages = interview_request.interview_request_messages
                                       .includes(:sender)
                                       .order(:created_at)
                                       .page(sanitized_page)
                                       .per(sanitized_per_page)

          render json: {
            interview_request_messages: ActiveModelSerializers::SerializableResource.new(
              messages, each_serializer: InterviewRequestMessageSerializer
            ),
            meta: {
              current_page: messages.current_page,
              total_pages: messages.total_pages,
              total_count: messages.total_count,
              per_page: messages.limit_value
            }
          }, status: :ok
        end

        def create
          message = ::Teacher::CreateInterviewRequestMessageService.new(
            user: current_user,
            interview_request_id: params[:interview_request_id],
            body: create_message_params[:body]
          ).call

          render json: message, serializer: InterviewRequestMessageSerializer, status: :created
        end

        private

        def interview_request
          InterviewRequest.for_participant(current_user).find_by!(id: params[:interview_request_id])
        end

        def create_message_params
          params.require(:interview_request_message).permit(:body)
        end
      end
    end
  end
end
