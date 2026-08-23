# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Auth::SignUpService, type: :service do
  subject { described_class.new(form).call }

  let!(:high_school) { create(:high_school, name: 'テスト高校') }
  let(:high_school_id) { high_school.id }
  let!(:user_role) { create(:user_role, name: :student) }
  let!(:grade) { create(:grade, high_school: high_school, year: 1) }

  let(:form) do
    Auth::SignUpForm.new(
      email: 'test@example.com',
      name: '山田太郎',
      name_kana: 'ヤマダタロウ',
      password: 'password',
      password_confirmation: 'password',
      user_role_name: user_role_name,
      high_school_id: high_school_id,
      grade_id: grade.id
    )
  end

  context '正常系' do
    let(:user_role_name) { 'student' }
    let(:school_name) { 'テスト高校' }

    it 'ユーザーが作成される' do
      expect { subject }.to change(User, :count).by(1)

      user = subject
      expect(user.user_role).to eq(user_role)
      expect(user.high_school.name).to eq(school_name)
    end
  end

  context '異常系' do
    context 'roleが存在しない場合' do
      let(:user_role_name) { 'invalid_role' }
      let(:school_name) { 'テスト高校' }

      it 'SignUpErrorをraiseする' do
        expect { subject }.to raise_error(Auth::SignUpService::SignUpError, '無効なユーザーロールです')
      end
    end

    context 'schoolが存在しない場合' do
      let(:user_role_name) { 'student' }
      let(:high_school_id) { 9_999_999_999_999 }

      it 'SignUpErrorをraiseする' do
        expect { subject }.to raise_error(Auth::SignUpService::SignUpError, '学校が見つかりません')
      end
    end
  end

  context '生徒コードによるclaim' do
    let(:user_role_name) { 'student' }

    let(:form) do
      Auth::SignUpForm.new(
        email: 'test@example.com',
        name: '山田太郎',
        name_kana: 'ヤマダタロウ',
        password: 'password',
        password_confirmation: 'password',
        user_role_name: user_role_name,
        high_school_id: high_school_id,
        grade_id: grade.id,
        student_number: student_number
      )
    end

    context '有効な生徒コードが入力された場合' do
      let!(:pre_created_user) do
        create(:user, user_role: user_role, high_school: high_school, grade: grade,
                      student_number: "#{high_school.school_code}-AAAAAAAA",
                      password_reset_required: true, email: 'old@example.com')
      end
      let(:student_number) { pre_created_user.student_number }

      it '新規Userを作らず既存Userを更新する' do
        expect { subject }.not_to change(User, :count)

        user = subject
        expect(user.id).to eq(pre_created_user.id)
        expect(user.email).to eq('test@example.com')
        expect(user.password_reset_required).to be false
      end
    end

    context '該当するUserが存在しないコードの場合' do
      let(:student_number) { "#{high_school.school_code}-NOTEXIST" }

      it 'SignUpErrorをraiseする' do
        expect { subject }.to raise_error(Auth::SignUpService::SignUpError, '生徒コードが正しくありません')
      end
    end

    context '存在しない学校コードを含む生徒コードの場合' do
      let(:student_number) { 'ZZZZZZ-NOTEXIST' }

      it 'SignUpErrorをraiseする' do
        expect { subject }.to raise_error(Auth::SignUpService::SignUpError, '生徒コードが正しくありません')
      end
    end

    context 'コードが示す高校が選択した高校と異なる場合' do
      let(:other_high_school) { create(:high_school) }
      let!(:pre_created_user) do
        create(:user, user_role: user_role, high_school: other_high_school,
                      grade: create(:grade, high_school: other_high_school),
                      student_number: "#{other_high_school.school_code}-AAAAAAAA",
                      password_reset_required: true)
      end
      let(:student_number) { pre_created_user.student_number }

      it 'SignUpErrorをraiseする' do
        expect { subject }.to raise_error(Auth::SignUpService::SignUpError, '生徒コードが正しくありません')
      end
    end

    context '既に有効化済みのアカウントの場合' do
      let!(:pre_created_user) do
        create(:user, user_role: user_role, high_school: high_school, grade: grade,
                      student_number: "#{high_school.school_code}-AAAAAAAA",
                      password_reset_required: false)
      end
      let(:student_number) { pre_created_user.student_number }

      it 'SignUpErrorをraiseする' do
        expect { subject }.to raise_error(Auth::SignUpService::SignUpError, 'このアカウントは既に有効化されています')
      end
    end
  end
end
