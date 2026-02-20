class SendResetPasswordEmailJob < ApplicationJob
  queue_as :mailers

  def perform(user_id, token)
    user = User.find(user_id)

    AuthMailer.send_email(user, token).deliver_now
  end
end
