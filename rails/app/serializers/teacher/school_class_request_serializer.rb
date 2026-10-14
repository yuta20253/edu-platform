# frozen_string_literal: true

module Teacher
  class SchoolClassRequestSerializer < ActiveModel::Serializer
    attributes :id, :action, :status, :name, :reason, :lock_version,
               :approved_at, :cancelled_at, :created_at,
               :school_class, :applicant, :approver,
               :can_process, :can_cancel

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

    # update(承認/却下)が受け付ける条件と揃える
    # (RequireManageOtherTeachers・ProcessSchoolClassRequestService#applicant?)
    def can_process
      object.pending? && !own_request? && current_user.teacher_permission&.manage_other_teachers? == true
    end

    # destroy(取消)が受け付ける条件と揃える(CancelSchoolClassRequestService)
    def can_cancel
      object.pending? && own_request?
    end

    private

    def current_user
      instance_options.fetch(:current_user)
    end

    def own_request?
      object.applicant_id == current_user.id
    end

    # 新設の申請・承認後に削除されたクラス・未処理の承認者はnilになる
    def id_and_name(record)
      return if record.nil?

      { id: record.id, name: record.name }
    end
  end
end
