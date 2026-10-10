# frozen_string_literal: true

module Teacher
  class SchoolClassRequestSerializer < ActiveModel::Serializer
    attributes :id, :action, :status, :name, :reason, :lock_version,
               :approved_at, :cancelled_at, :created_at,
               :school_class, :applicant, :approver

    belongs_to :grade, serializer: GradeSerializer

    def school_class
      id_and_name(object.school_class)
    end

    def applicant
      id_and_name(object.applicant)
    end

    def approver
      id_and_name(object.approver)
    end

    private

    # 新設の申請・承認後に削除されたクラス・未処理の承認者はnilになる
    def id_and_name(record)
      return if record.nil?

      { id: record.id, name: record.name }
    end
  end
end
