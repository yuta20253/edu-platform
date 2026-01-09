user_roles = [
  "student",
  "teacher",
  "parent"
]

user_roles.each do |role|
  UserRole.find_or_create_by!(role_name: role)
end
