# frozen_string_literal: true

module Teacher
  module SchoolClassRequest
    class Creation
      def initialize(school_class_request:)
        @school_class_request = school_class_request
      end

      def call
        SchoolClass.create!(
          grade_id: @school_class_request.grade_id,
          name: @school_class_request.name
        )
      end
    end
  end
end
