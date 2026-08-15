# frozen_string_literal: true

module Teacher
  # 承認前の申請そのものを取り下げる。SchoolClassは一切変更しない(Deletionとは別物)
  class CancelSchoolClassRequestService
    def initialize(user:, id:)
      @user = user
      @school_class_request_id = id
    end

    def call
      return false unless school_class_request.pending?

      school_class_request.update!(status: :cancelled, cancelled_at: Time.current)
    end

    private

    def school_class_request
      @school_class_request ||= ::SchoolClassRequest.find_by!(
        id: @school_class_request_id,
        applicant_id: @user.id
      )
    end
  end
end
