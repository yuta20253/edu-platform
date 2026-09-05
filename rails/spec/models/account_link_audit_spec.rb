# == Schema Information
#
# Table name: account_link_audits
#
#  id              :bigint           not null, primary key
#  user_id         :bigint           not null
#  merged_user_id  :bigint           not null
#  student_number  :string(255)      not null
#  high_school_id  :bigint           not null
#  grade_id        :bigint           not null
#  school_class_id :bigint
#  result          :string(255)      not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#
require 'rails_helper'

RSpec.describe AccountLinkAudit, type: :model do
  pending "add some examples to (or delete) #{__FILE__}"
end
