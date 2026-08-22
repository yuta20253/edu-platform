# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class SchoolClassRequestsController < Api::V1::Teacher::BaseController
        ALLOWED_UPDATE_STATUSES = %w[approved rejected].freeze

        before_action :require_manage_other_teachers!, only: :update
        before_action :require_valid_update_status!, only: :update

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

        def destroy_school_class_params
          params.permit(:reason)
        end

        def require_manage_other_teachers!
          return if current_user.teacher_permission.manage_other_teachers

          render json: { errors: ['承認権限がないユーザーです'] }, status: :forbidden
        end

        def require_valid_update_status!
          return if update_school_class_params[:status].in?(ALLOWED_UPDATE_STATUSES)

          render json: { errors: ['指定できないステータスです'] }, status: :unprocessable_content
        end
      end
    end
  end
end
