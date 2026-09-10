# frozen_string_literal: true

module StudentNumberable
  extend ActiveSupport::Concern

  included do
    validates :student_number, uniqueness: true, allow_nil: true
    validates :student_number, absence: true, unless: :student?
  end

  STUDENT_NUMBER_DELIMITER = '-'
  STUDENT_NUMBER_FORMAT = /\A[A-Z0-9]+#{STUDENT_NUMBER_DELIMITER}[A-Z0-9]+\z/

  def generate_student_number
    raise "生徒以外(#{user_role&.name})にstudent_numberは発行できません" unless student?

    self.student_number = loop do
      code = "#{high_school.school_code}#{STUDENT_NUMBER_DELIMITER}#{SecureRandom.alphanumeric(8).upcase}"
      break code unless User.exists?(student_number: code)
    end
  end

  class_methods do
    def student_number_format_valid?(value)
      value.present? && value.match?(STUDENT_NUMBER_FORMAT)
    end

    def school_code_from_student_number(value)
      value.to_s.split(STUDENT_NUMBER_DELIMITER, 2).first
    end
  end
end
