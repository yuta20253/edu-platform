# frozen_string_literal: true

module Teacher
  module SchoolClassRequest
    class Modification
      def initialize(school_class_request:)
        @school_class_request = school_class_request
      end

      def call
        school_class.update!(
          grade_id: @school_class_request.grade_id,
          name: @school_class_request.name
        )
      end

      private

      def school_class
        ::SchoolClass.find(@school_class_request.school_class_id)
      end
    end
  end
end
