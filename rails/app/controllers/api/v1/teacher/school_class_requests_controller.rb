# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class SchoolClassRequestsController < Api::V1::Teacher::BaseController
        include RequireManageOtherTeachers

        ALLOWED_UPDATE_STATUSES = %w[approved rejected].freeze

        before_action -> { require_manage_other_teachers!('承認権限がないユーザーです') }, only: :update
        before_action :require_valid_update_status!, only: :update

        def index
          school_class_requests = school_class_requests_scope.page(sanitized_page).per(sanitized_per_page)

          render json: {
            school_class_requests: ActiveModelSerializers::SerializableResource.new(
              school_class_requests, each_serializer: ::Teacher::SchoolClassRequestSerializer,
              current_user: current_user,
            ),
            meta: {
              current_page: school_class_requests.current_page,
              total_pages: school_class_requests.total_pages,
              total_count: school_class_requests.total_count,
              per_page: school_class_requests.limit_value
            }
          }, status: :ok
        end

        def show
          school_class_request = school_class_requests_scope.find(params[:id])

          render json: school_class_request, serializer: ::Teacher::SchoolClassRequestSerializer, current_user: current_user , status: :ok
        end

        def create
          form = ::Teacher::CreateSchoolClassRequestForm.new(
            user: current_user,
            **create_school_class_params.to_h.symbolize_keys
          )

          if form.save
            render json: { message: '学級作成申請を受け付けました' }, status: :created
          else
            render json: { errors: form.errors.full_messages }, status: :unprocessable_content
          end
        end

        def update
          result = ::Teacher::ProcessSchoolClassRequestService
                   .new(
                     user: current_user,
                     id: params[:id],
                     **update_school_class_params.to_h.symbolize_keys
                   ).call

          if result
            render json: { message: '申請が承認されました' }, status: :ok
          else
            render json: { message: '申請が却下されました' }, status: :ok
          end
        end

        def destroy
          result = ::Teacher::CancelSchoolClassRequestService.new(
            user: current_user,
            id: params[:id],
            **destroy_school_class_params.to_h.symbolize_keys
          ).call

          if result
            render json: { message: '申請を取り消しました' }, status: :ok
          else
            render json: { errors: ['承認待ちの申請のみ取り消せます'] }, status: :unprocessable_content
          end
        end

        private

        def create_school_class_params
          params.require(:school_class_request).permit(:name, :grade_id, :school_class_id, :action)
        end

        def update_school_class_params
          params.require(:school_class_request).permit(:status, :lock_version, :reason)
        end

        def school_class_requests_scope
          @school_class_requests = SchoolClassRequest
            .joins(:grade)
            .where(grades: { high_school_id: current_user.high_school_id })
            .order(created_at: :desc)

          @school_class_requests = @school_class_requests.where(status: params[:status]) if params[:status].present?
          @school_class_requests = @school_class_requests.where(applicant_id: current_user.id) unless manage_other_teachers?
          @school_class_requests
        end

        def destroy_school_class_params
          params.permit(:reason)
        end

        def require_valid_update_status!
          return if update_school_class_params[:status].in?(ALLOWED_UPDATE_STATUSES)

          render json: { errors: ['指定できないステータスです'] }, status: :unprocessable_content
        end
      end
    end
  end
end
