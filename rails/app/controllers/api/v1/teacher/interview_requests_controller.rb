# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class InterviewRequestsController < Api::V1::Teacher::BaseController
        ALLOWED_UPDATE_STATUSES = %w[confirmed completed].freeze

        before_action :require_valid_update_status!, only: :update

        def index
          requests = scoped_interview_requests.order(created_at: :desc).page(sanitized_page).per(sanitized_per_page)
          render json: {
            interview_requests: ActiveModelSerializers::SerializableResource.new(
              requests, each_serializer: InterviewRequestSerializer
            ),
            meta: {
              current_page: requests.current_page,
              total_pages: requests.total_pages,
              total_count: requests.total_count,
              per_page: requests.limit_value
            }
          }, status: :ok
        end

        def show
          interview_request = scoped_interview_requests.find(params[:id])
          render json: interview_request, serializer: InterviewRequestSerializer, status: :ok
        end

        def create
          form = ::Teacher::CreateInterviewRequestForm.new(
            user: current_user,
            **create_interview_request_params.to_h.symbolize_keys
          )

          if form.save
            render json: { message: '面談を申請しました' }, status: :created
          else
            render json: { errors: form.errors.full_messages }, status: :unprocessable_content
          end
        end

        def update
          result = ::Teacher::ProcessInterviewRequestService.new(
            user: current_user,
            id: params[:id],
            **update_interview_request_params.to_h.symbolize_keys
          ).call

          if result
            render json: { message: 'ステータスを更新しました' }, status: :ok
          else
            render json: { errors: ['指定できない操作です'] }, status: :unprocessable_content
          end
        end

        def destroy
          result = ::Teacher::CancelInterviewRequestService.new(
            user: current_user,
            id: params[:id],
            **destroy_interview_request_params.to_h.symbolize_keys
          ).call

          if result
            render json: { message: '面談をキャンセルしました' }, status: :ok
          else
            render json: { errors: ['進行中の面談のみキャンセルできます'] }, status: :unprocessable_content
          end
        end

        private

        def scoped_interview_requests
          relation = InterviewRequest.includes(:student, :teacher).for_participant(current_user)
          relation = relation.where(status: params[:status]) if params[:status].present?
          relation
        end

        def create_interview_request_params
          params.require(:interview_request).permit(:student_id, :reason_detail)
        end

        def update_interview_request_params
          params.require(:interview_request).permit(:status, :lock_version, :scheduled_at)
        end

        def destroy_interview_request_params
          params.permit(:reason, :lock_version)
        end

        def require_valid_update_status!
          return if update_interview_request_params[:status].in?(ALLOWED_UPDATE_STATUSES)

          render json: { errors: ['指定できないステータスです'] }, status: :unprocessable_content
        end
      end
    end
  end
end
