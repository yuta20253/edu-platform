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

      result = ActiveRecord::Base.transaction do
        update_school_class_request

        process_school_class_request if school_class_request.approved?
      end

      notify_applicant

      result
    end

    private

    def notify_applicant
      Teacher::CreateSchoolClassRequestResultNotificationService.new(
        school_class_request: school_class_request,
        approver: @user
      ).call
    end

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
        create_school_class
      when 'modification'
        update_school_class
      when 'deletion'
        destroy_school_class
      end
    end

    def create_school_class
      ::SchoolClass.create!(
        grade_id: school_class_request.grade_id,
        name: school_class_request.name
      )
    end

    def update_school_class
      school_class.update!(
        grade_id: school_class_request.grade_id,
        name: school_class_request.name
      )
    end

    def destroy_school_class
      school_class.destroy!
    end

    def school_class
      @school_class ||= school_class_request.school_class
    end

    def update_school_class_request
      school_class_request.update!(
        status: @attributes[:status],
        approver_id: @user.id,
        approved_at: approved_at,
        reason: @attributes[:reason],
        lock_version: @attributes[:lock_version]
      )
    end

    def approved_at
      return nil if @attributes[:status] != 'approved'

      Time.current
    end
  end
end
