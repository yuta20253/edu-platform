# frozen_string_literal: true

# == Schema Information
#
# Table name: school_class_requests
#
#  id              :bigint           not null, primary key
#  school_class_id :bigint
#  applicant_id    :bigint           not null
#  approver_id     :bigint
#  grade_id        :bigint           not null
#  action          :integer          not null
#  status          :integer          default(0), not null
#  name            :string(255)
#  approved_at     :datetime
#  cancelled_at    :datetime
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#
class SchoolClassRequest < ApplicationRecord
  belongs_to :school_class, optional: true
  belongs_to :applicant, class_name: 'User'
  belongs_to :approver, class_name: 'User', optional: true
  belongs_to :grade
end
