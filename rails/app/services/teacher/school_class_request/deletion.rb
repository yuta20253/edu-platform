# frozen_string_literal: true

module Teacher
  module SchoolClassRequest
    # 承認済みの削除申請を実行し、実際のSchoolClassを削除する(申請の取り下げはCancelSchoolClassRequestService)
    class Deletion
      def initialize(school_class_request:)
        @school_class_request = school_class_request
      end

      def call
        school_class.destroy!
      end

      private

      def school_class
        ::SchoolClass.find(@school_class_request.school_class_id)
      end
    end
  end
end
