# frozen_string_literal: true

module Teacher
  class ProcessSchoolClassRequestService
    def initialize(user:, id:, **attributes)
      @user = user
      @school_class_request_id = id
      @attributes = attributes
    end

    def call
      ActiveRecord::Base.transaction do
        return false unless school_class_request.pending?

        update_school_class_request

        return false unless school_class_request.approved?

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
    end

    private

    def school_class_request
      SchoolClassRequest
        .joins(:grade)
        .find_by!(
          id: @school_class_request_id,
          grades: { high_school_id: @user.high_school_id }
        )
    end

    def update_school_class_request
      school_class_request.update!(
        status: @attributes[:status],
        approver_id: @user.id,
        approved_at: approved_at
      )
    end

    def approved_at
      return nil if @attributes[:status] != :approved

      Time.current
    end
  end
end
