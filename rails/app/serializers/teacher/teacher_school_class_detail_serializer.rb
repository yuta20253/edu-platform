# frozen_string_literal: true

module Teacher
  class TeacherSchoolClassDetailSerializer < ActiveModel::Serializer
    attributes :id, :name, :teachers, :students

    belongs_to :grade, serializer: GradeSerializer

    def teachers
      object.teacher_school_classes.map do |tsc|
        { id: tsc.user_id, name: tsc.user.name, role: tsc.role }
      end
    end

    def students
      object.users.sort_by(&:name_kana).map do |ssc|
        { id: ssc.id, name: ssc.name, name_kana: ssc.name_kana }
      end
    end
  end
end
