class TeacherSerializer < ActiveModel::Serializer
  attributes :id, :name, :name_kana, :grade

  belongs_to :grade, serializer: GradeSerializer
end
