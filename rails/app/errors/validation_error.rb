# frozen_string_literal: true

class ValidationError < StandardError
  attr_reader :errors

  def initialize(errors)
    super()
    @errors = errors
  end
end
