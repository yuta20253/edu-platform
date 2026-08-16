# frozen_string_literal: true

module Student
  class AlreadyCompletedStudyLogError < StandardError
    attr_reader :errors

    def initialize(errors)
      super(errors.join(', '))
      @errors = errors
    end
  end
end
