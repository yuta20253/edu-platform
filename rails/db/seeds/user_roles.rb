# frozen_string_literal: true

user_roles = %w[
  student
  teacher
  parent
]

user_roles.each do |role|
  UserRole.find_or_create_by!(role_name: role)
end
