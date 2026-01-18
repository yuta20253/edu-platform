# frozen_string_literal: true

UserRole.names.each_key do |role|
  UserRole.find_or_create_by!(name: role)
end
