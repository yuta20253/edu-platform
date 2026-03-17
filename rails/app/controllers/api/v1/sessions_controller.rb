# frozen_string_literal: true

module Api
  module V1
    class SessionsController < Devise::SessionsController
      respond_to :json

      def create
        request.env['devise.mapping'] = Devise.mappings[:user]
        form = Auth::LoginForm.new(email: params[:email], password: params[:password])

        return render json: { errors: form.errors.full_messages }, status: :unprocessable_content if form.invalid?

        user = Auth::LoginService.new(form).call

        sign_in(user, store: false)

        token = request.env['warden-jwt_auth.token']

        cookies[:access_token] = {
          value: token,
          httponly: true,
          secure: Rails.env.production?,
          same_site: :lax,
          path: '/',
          expires: 1.day.from_now
        }

        response.headers.delete('Authorization')

        render json: {
                 user: ActiveModelSerializers::SerializableResource.new(
                   user,
                   serializer: CurrentUserSerializer
                 )
               },
               status: :ok
      rescue Auth::LoginService::LoginError => e
        render json: { errors: [e.message] }, status: :unauthorized
      end

      def destroy
        current_user&.update!(jti: SecureRandom.uuid)
        super
      end

      def respond_to_on_destroy
        cookies.delete(:access_token, path: '/')

        render json: { message: 'ログアウトしました。' }, status: :ok
      end
    end
  end
end
