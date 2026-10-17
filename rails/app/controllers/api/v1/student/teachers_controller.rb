# frozen_string_literal: true

module Api
  module V1
    module Student
      class TeachersController < Api::V1::Student::BaseController
        def index
          render json: {
            teachers: ActiveModelSerializers::SerializableResource.new(
              teachers, each_serializer: ::Student::TeacherSerializer
            )
          }, status: :ok
        end

        private

        # 面談申請先として選べる、自分の学級の担当教員(論理削除済みを除く)
        def teachers
          school_class = current_user.school_class
          return User.none if school_class.nil?

          school_class.teachers.active.order(:id)
        end
      end
    end
  end
end
