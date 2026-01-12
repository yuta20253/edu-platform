class Auth::SignUpService
  class JWTGenerationError < StandardError;end

  def initialize(form)
    @form = form
  end

  def call
    ActiveRecord::Base.transaction do
      role = UserRole.find_by!(role_name: @form.role_name)
      high_school = HighSchool.find_by!(school_name: @form.school_name)

      user = User.create!(@form.to_attributes.merge(user_role_id: role.id, high_school_id: high_school.id))

      token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first

      raise JWTGenerationError if token.blank?

      [user, token]
    end
  end
end
