# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::CreateAccountService, type: :service do
  subject(:service) do
    described_class.new(
      name: '山田太郎',
      name_kana: 'ヤマダタロウ',
      email: 'new-student@example.com',
      high_school: high_school,
      grade: grade,
      school_class: school_class
    )
  end

  let!(:student_role) { create(:user_role, :student) }
  let!(:high_school) { create(:high_school) }
  let!(:grade) { create(:grade, high_school: high_school, year: 1) }
  let!(:school_class) { create(:school_class, grade: grade, name: 'A組') }

  describe '#call' do
    it '新規Userを作成する' do
      expect { service.call }.to change(User, :count).by(1)
    end

    it '生徒として所属高校・学年・学級・氏名が設定される' do
      user = service.call

      expect(user).to be_student
      expect(user.high_school).to eq(high_school)
      expect(user.grade).to eq(grade)
      expect(user.school_class).to eq(school_class)
      expect(user.name).to eq('山田太郎')
    end

    it '生徒コードが発行される' do
      user = service.call

      expect(user.student_number).to match(/\A#{high_school.school_code}-/)
    end

    it 'password_reset_requiredがtrueになる(招待待ち状態)' do
      user = service.call

      expect(user.password_reset_required).to be true
    end

    it 'reset_password_tokenが発行される' do
      user = service.call

      expect(user.reset_password_token).to be_present
    end

    it '招待メールが送信される' do
      expect { service.call }.to have_enqueued_mail(AuthMailer, :invite_user)
    end
  end
end
