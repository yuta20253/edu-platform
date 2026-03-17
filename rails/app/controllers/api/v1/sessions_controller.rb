# frozen_string_literal: true

module Api
  module V1
    class SessionsController < Devise::SessionsController
      before_action :authenticate_user!, only: [:destroy]
      skip_after_action :verify_signed_out_user, only: [:destroy]
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
        current_user.update!(jti: SecureRandom.uuid)

        cookies[:access_token] = {
          value: '',
          httponly: true,
          secure: Rails.env.production?,
          same_site: :lax,
          path: '/',
          expires: Time.zone.at(0)
        }
        request.headers.delete('Authorization')

        render json: { message: 'ログアウトしました。' }, status: :ok
      end

      private

      def set_jwt_cookie
        auth = response.headers['Authorization']
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

        response.headers.delete('Authorization')
      end
    end
  end
end
