# frozen_string_literal: true

module Teacher
  class ImportHistoryDetailSerializer < ActiveModel::Serializer
    attributes :id, :file_name, :status, :mode, :total_count, :success_count, :error_count,
               :started_at, :finished_at, :created_at,
               :students, :errors

    def students
      object.imported_students.map do |imported_student|
        user = imported_student.user

        {
          id: user.id,
          name: user.name,
          name_kana: user.name_kana,
          email: user.email,
          student_number: user.student_number,
          grade: user.grade&.display_name,
          school_class: user.school_class&.name,
          action: imported_student.action
        }
      end
    end

    def errors
      object.import_errors.map do |import_error|
        { row_number: import_error.row_number, message: import_error.message }
      end
    end
  end
end
