# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Common::CreateUserService, type: :service do
  # role_name/build_userだけを実装した最小のサブクラス。
  # 共通処理(ロール解決・トランザクション・招待メール送信)だけを検証する。
  subject(:service) { dummy_class.new(email: 'new-user@example.com') }

  let(:dummy_class) do
    Class.new(described_class) do
      def initialize(email:)
        super()
        @email = email
      end

      private

      def role_name
        :admin
      end

      def build_user(role, password)
        User.new(
          name: 'テストユーザー',
          email: @email,
          user_role: role,
          password: password,
          password_confirmation: password
        )
      end
    end
  end

  describe '#call' do
    it '新規Userを作成する' do
      expect { service.call }.to change(User, :count).by(1)
    end

    it 'role_nameで指定したロールが解決される' do
      user = service.call

      expect(user.user_role.name).to eq('admin')
    end

    it 'ロールが未作成の場合は新規作成される' do
      expect(UserRole.find_by(name: :admin)).to be_nil

      expect { service.call }.to change(UserRole, :count).by(1)
    end

    it 'reset_password_tokenが発行される' do
      user = service.call

      expect(user.reset_password_token).to be_present
    end

    it '招待メールが送信される' do
      expect { service.call }.to have_enqueued_mail(AuthMailer, :invite_user)
    end

    context 'after_createをオーバーライドしたサブクラスの場合' do
      let(:dummy_class_with_hook) do
        Class.new(described_class) do
          def initialize(email:)
            super()
            @email = email
          end

          attr_reader :after_create_called

          private

          def role_name
            :admin
          end

          def build_user(role, password)
            User.new(
              name: 'テストユーザー',
              email: @email,
              user_role: role,
              password: password,
              password_confirmation: password
            )
          end

          def after_create(user)
            @after_create_called = user
          end
        end
      end

      it 'user.save!の後にafter_createが呼ばれる' do
        service = dummy_class_with_hook.new(email: 'hook@example.com')

        user = service.call

        expect(service.after_create_called).to eq(user)
      end
    end

    context '招待メール送信で例外が発生した場合' do
      before do
        allow(AuthMailer).to receive(:invite_user).and_raise(StandardError, 'メール失敗')
      end

      it 'Userの作成もロールバックされる' do
        expect { service.call }.to raise_error(StandardError)
        expect(User.count).to eq(0)
      end
    end
  end
end
