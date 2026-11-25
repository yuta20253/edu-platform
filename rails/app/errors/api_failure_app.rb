# frozen_string_literal: true

# 未認証時の応答を {"errors": [...]} 形式の日本語メッセージにそろえる
class ApiFailureApp < Devise::FailureApp
  def http_auth_body
    { errors: [i18n_message] }.to_json
  end
end
