# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::AccountLinkService, type: :service do
  subject(:call) { described_class.new(user: user, student_number: student_number).call }

  let(:user) { create(:user, :student) }

  describe '#call' do
    context '未利用の仮Userが存在する場合' do
      let!(:target_user) do
        create(:user, :student, :invitation_pending, :with_school_class, student_number: 'AB12-CD3456')
      end
      let(:student_number) { target_user.student_number }

      it '仮Userの学校情報がログイン中Userへコピーされる' do
        call

        user.reload
        expect(user.high_school_id).to eq(target_user.high_school_id)
        expect(user.grade_id).to eq(target_user.grade_id)
        expect(user.school_class_id).to eq(target_user.school_class_id)
        expect(user.student_number).to eq('AB12-CD3456')
      end

      it 'ログイン中Userのメールアドレス・パスワードが維持される' do
        original_email = user.email
        original_encrypted_password = user.encrypted_password

        call

        user.reload
        expect(user.email).to eq(original_email)
        expect(user.encrypted_password).to eq(original_encrypted_password)
      end

      it '仮Userが削除される' do
        call

        expect(User.exists?(target_user.id)).to be(false)
      end

      it '監査ログが記録される' do
        call

        audit = AccountLinkAudit.last
        expect(audit.user_id).to eq(user.id)
        expect(audit.merged_user_id).to eq(target_user.id)
        expect(audit.student_number).to eq('AB12-CD3456')
        expect(audit.result).to eq('success')
      end
    end

    context '存在しないstudent_numberを指定した場合' do
      let(:student_number) { 'ZZ99-NOTFOUND1' }

      it 'RecordNotFoundが発生する' do
        expect { call }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end

    context 'student_numberが空の場合' do
      let(:student_number) { '' }

      it 'InvalidFormatErrorが発生する' do
        expect { call }.to raise_error(Student::AccountLinkService::InvalidFormatError)
      end
    end

    context 'student_numberの形式が不正な場合' do
      let(:student_number) { 'invalid format!!' }

      it 'InvalidFormatErrorが発生する' do
        expect { call }.to raise_error(Student::AccountLinkService::InvalidFormatError)
      end
    end

    context '自分自身が既に紐付け済みのstudent_numberを指定した場合' do
      let(:user) { create(:user, :student, student_number: 'SELF-000001') }
      let(:student_number) { 'SELF-000001' }

      it 'AlreadyLinkedErrorが発生する' do
        expect { call }.to raise_error(Student::AccountLinkService::AlreadyLinkedError)
      end
    end

    context '既に有効化済みのUserのstudent_numberを指定した場合' do
      let!(:target_user) do
        create(:user, :student, :invitation_completed, :with_school_class, student_number: 'ACT-000001')
      end
      let(:student_number) { 'ACT-000001' }

      it 'AlreadyActivatedErrorが発生する' do
        expect { call }.to raise_error(Student::AccountLinkService::AlreadyActivatedError)
      end

      it '仮Userが削除されない' do
        expect { call }.to raise_error(StandardError)
        expect(User.exists?(target_user.id)).to be(true)
      end
    end

    context '仮Userに関連データ(学習履歴)が存在する場合' do
      let!(:target_user) do
        create(:user, :student, :invitation_pending, :with_school_class, student_number: 'DEP-000001')
      end
      let(:student_number) { 'DEP-000001' }

      before { create(:study_log, user: target_user, task: create(:task, user: target_user)) }

      it 'HasDependentDataErrorが発生する' do
        expect { call }.to raise_error(Student::AccountLinkService::HasDependentDataError)
      end

      it '仮Userが削除されない' do
        expect { call }.to raise_error(StandardError)
        expect(User.exists?(target_user.id)).to be(true)
      end
    end

    context '統合処理の途中で保存エラーが発生した場合' do
      let!(:target_user) do
        create(:user, :student, :invitation_pending, :with_school_class, student_number: 'ROLL-000001')
      end
      let(:student_number) { 'ROLL-000001' }

      before do
        allow(user).to receive(:update!).and_raise(ActiveRecord::RecordInvalid.new(user))
      end

      it 'トランザクションがロールバックされ仮Userが削除されない' do
        expect { call }.to raise_error(ActiveRecord::RecordInvalid)

        expect(User.exists?(target_user.id)).to be(true)
      end

      it '監査ログも作成されない' do
        expect { call }.to raise_error(ActiveRecord::RecordInvalid)

        expect(AccountLinkAudit.count).to eq(0)
      end
    end
  end
end
