# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class PermissionsController < Api::V1::Teacher::BaseController
        before_action :set_teacher, only: %i[show update]
        before_action :require_manage_other_teachers!, only: :update

        def index
          teachers = teachers_query.order(:name_kana).page(params[:page]).per(20)

          render json: {
            current_user: ActiveModelSerializers::SerializableResource.new(
              current_user, serializer: TeacherSerializer
            ),
            teachers: ActiveModelSerializers::SerializableResource.new(
              teachers, each_serializer: ::Teacher::TeacherPermissionManagementSerializer
            ),
            meta: {
              current_page: teachers.current_page,
              total_pages: teachers.total_pages,
              total_count: teachers.total_count,
              per_page: 20
            }
          }, status: :ok
        end

        def show
          render json: @teacher, serializer: ::Teacher::TeacherPermissionManagementSerializer
        end

        def update
          return render_update_error('自分自身は更新できません') if @teacher == current_user
          return render_update_error('最後の教員は更新できません') if only_active_teacher?(@teacher)

          form = ::Teacher::UpdatePermissionForm.new(
            target: @teacher,
            **update_permission_params.to_h.symbolize_keys
          )

          if form.save
            render json: { message: '権限更新に成功しました' }, status: :ok
          else
            render json: { errors: form.errors.full_messages }, status: :unprocessable_content
          end
        end

        private

        def set_teacher
          @teacher = teachers_query.active.find(params[:id])
        end

        def update_permission_params
          params.require(:teacher_permission).permit(:grade_scope, :manage_other_teachers)
        end

        def teachers_query
          query = ::Teacher::TeachersQuery.new(current_user.high_school.users).colleagues_for_permissions
          query.result
        end

        def only_active_teacher?(target)
          !teachers_query.active.where.not(id: target.id).exists?
        end

        def render_update_error(message)
          render json: { errors: [message] }, status: :unprocessable_content
        end

        def require_manage_other_teachers!
          return if current_user.teacher_permission.manage_other_teachers?

          render_update_error('他教員を編集する権限がありません')
        end
      end
    end
  end
end
