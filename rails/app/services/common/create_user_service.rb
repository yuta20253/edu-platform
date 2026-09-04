# frozen_string_literal: true

module Common
  # 新規User作成の共通処理(仮パスワード発行・ロール解決・DBトランザクション・招待メール送信)を担う。
  # サブクラスはrole_name/build_userを実装し、必要ならafter_createで追加のセットアップを行う。
  class CreateUserService
    def call
      password = SecureRandom.hex(16)
      role = UserRole.find_or_create_by!(name: role_name)

      ActiveRecord::Base.transaction do
        user = build_user(role, password)
        user.save!

        after_create(user)
        invite(user)

        user
      end
    end

    private

    def role_name
      raise NotImplementedError, "#{self.class}は#role_nameを実装してください"
    end

    def build_user(_role, _password)
      raise NotImplementedError, "#{self.class}は#build_userを実装してください"
    end

    def after_create(_user); end

    def invite(user)
      token = user.send(:set_reset_password_token)
      AuthMailer.invite_user(user, token).deliver_later
    end
  end
end
