# frozen_string_literal: true

module Student
  # 生徒が面談申請先として選ぶ教員。生徒に見せる情報は id と名前のみに限定する
  class TeacherSerializer < ActiveModel::Serializer
    attributes :id, :name
  end
end
