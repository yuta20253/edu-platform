class Api::V1::PasswordResetsController < ApplicationController
  skip_before_action :authenticate_user!, only: [:create, :update]

  def create
    user = User.find_by(email: params[:email])
    Auth::ResetPasswordService.new(user).call

    render json: { message: "パスワード変更メールを送信しました。" }, status: :ok
  end
end
