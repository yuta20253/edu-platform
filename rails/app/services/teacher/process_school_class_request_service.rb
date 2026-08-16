# frozen_string_literal: true

module Teacher
  class ProcessSchoolClassRequestService
    class ApplicantCannotProcessOwnRequestError < StandardError; end

    def initialize(user:, id:, **attributes)
      @user = user
      @school_class_request_id = id
      @attributes = attributes
    end

    def call
      return false unless school_class_request.pending?
      raise ApplicantCannotProcessOwnRequestError if applicant?

      ActiveRecord::Base.transaction do
        update_school_class_request

        process_school_class_request if school_class_request.approved?
      end
    end

    private

    def applicant?
      school_class_request.applicant_id == @user.id
    end

    def school_class_request
      @school_class_request ||= ::SchoolClassRequest
                                .joins(:grade)
                                .find_by!(
                                  id: @school_class_request_id,
                                  grades: { high_school_id: @user.high_school_id }
                                )
    end

    def process_school_class_request
      case school_class_request.action
      when 'creation'
        ::Teacher::SchoolClassRequest::Creation.new(
          school_class_request: school_class_request
        ).call
      when 'modification'
        ::Teacher::SchoolClassRequest::Modification.new(
          school_class_request: school_class_request
        ).call
      when 'deletion'
        ::Teacher::SchoolClassRequest::Deletion.new(
          school_class_request: school_class_request
        ).call
      end
    end

    def update_school_class_request
      raise ActiveRecord::StaleObjectError, school_class_request unless current_lock_version?

      school_class_request.update!(
        status: @attributes[:status],
        approver_id: @user.id,
        approved_at: approved_at
      )
    end

    def current_lock_version?
      school_class_request.lock_version == @attributes[:lock_version].to_i
    end

    def approved_at
      return false if @attributes[:status] != 'approved'

      Time.current
    end
  end
end
