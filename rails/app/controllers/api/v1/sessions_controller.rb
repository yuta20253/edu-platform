# frozen_string_literal: true

module Api
  module V1
    class SessionsController < Devise::SessionsController
      before_action :authenticate_user!, only: [:destroy]
      respond_to :json

      after_action :set_jwt_cookie, only: [:create]

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
          path: '/'
        }

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
        current_user.update!(jti: SecureRandom.uuid)

        cookies.delete(:access_token, path: '/')

        render json: { message: 'ログアウトしました。' }, status: :ok
      end

      private

      def set_jwt_cookie
        auth = response.header['Authorization']
        return unless auth&.start_with?('Bearer ')

        token = auth.split(' ', 2).last

        cookies[:access_token] = {
          value: token,
          httponly: true,
          secure: Rails.env.production?,
          same_site: :lax,
          path: '/',
          expires: 1.day.from_now
        }

        response.delete_header('Authorization')
      end
    end
  end
end
