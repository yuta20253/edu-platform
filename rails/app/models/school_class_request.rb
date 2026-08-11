# frozen_string_literal: true

class SchoolClassRequest < ApplicationRecord
  belongs_to :school_class, optional: true
  belongs_to :applicant, class_name: 'User'
  belongs_to :approver, class_name: 'User', optional: true
  belongs_to :grade
end
