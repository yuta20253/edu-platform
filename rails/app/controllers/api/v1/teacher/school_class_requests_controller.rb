# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class SchoolClassRequestsController < Api::V1::Teacher::BaseController
        def create
          ::Teacher::CreateSchoolClassRequestForm.new(
            user: current_user,
            **create_school_class_params.to_h.symbolize_keys
          )
        end

        def update
          unless current_user.teacher_permission.manage_other_teachers
            return render json: { errors: ['承認権限がないユーザーです'] },
                          status: :forbidden
          end

          result = ::Teacher::ApproveSchoolClassRequestService
                   .new(
                     user:,
                     id: params[:id],
                     **update_school_class_params.to_h.symbolize_keys
                   ).call

          if result
            render json: { message: '学級新規作成申請が承認されました' }, status: :created
          else
            render json: { message: '学級新規作成申請が却下されました' }, status: :ok
          end
        end

        private

        def create_school_class_params
          params.require(:school_class_request).permit(:name, :grade_id)
        end

        def update_school_class_params
          params.require(:school_class_request).permit(:status)
        end
      end
    end
  end
end
