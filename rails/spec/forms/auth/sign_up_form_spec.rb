# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Auth::SignUpForm, type: :model do
  let(:high_school) { create(:high_school) }

  def build_form(user_role_name:, student_number: nil)
    described_class.new(
      email: 'test@example.com',
      name: '山田太郎',
      name_kana: 'ヤマダタロウ',
      password: 'password',
      password_confirmation: 'password',
      user_role_name: user_role_name,
      high_school_id: high_school.id,
      grade_id: create(:grade, high_school: high_school).id,
      student_number: student_number
    )
  end

  describe 'student_numberのバリデーション' do
    context 'csv_managedな高校を選んだ生徒' do
      before { high_school.update!(csv_managed: true) }

      it '生徒コードが未入力だと無効' do
        form = build_form(user_role_name: 'student')

        expect(form).to be_invalid
        expect(form.errors[:student_number]).to include('生徒番号は必須です')
      end

      it '生徒コードが入力されていれば有効' do
        form = build_form(user_role_name: 'student', student_number: "#{high_school.school_code}-AAAAAAAA")

        expect(form).to be_valid
      end
    end

    context 'csv_managedではない高校を選んだ生徒' do
      it '生徒コードが未入力でも有効' do
        form = build_form(user_role_name: 'student')

        expect(form).to be_valid
      end
    end

    context 'teacherの場合' do
      before { high_school.update!(csv_managed: true) }

      it '生徒コードが未入力でも有効（生徒専用のバリデーションなので対象外）' do
        form = build_form(user_role_name: 'teacher')

        expect(form).to be_valid
      end
    end
  end
end
