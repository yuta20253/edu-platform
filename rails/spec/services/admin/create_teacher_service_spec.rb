# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::CreateTeacherService, type: :service do
  subject(:service) { described_class.new(school: school, email: email) }

  let!(:school) { create(:high_school) }
  let(:email) { 'tanaka@example.com' }

  context '正常系' do
    it 'User が作成される' do
      expect { service.call }.to change(User, :count).by(1)
    end

    it 'name に email の @ 以前の文字列が設定される' do
      service.call
      expect(User.find_by(email: email).name).to eq('tanaka')
    end

    it 'TeacherPermission がデフォルト値で作成される' do
      service.call
      user = User.find_by(email: email)
      expect(user.teacher_permission).to be_present
      expect(user.teacher_permission.grade_scope).to eq('own_grade')
      expect(user.teacher_permission.manage_other_teachers).to be(false)
    end
  end

  context '異常系 - email が重複している' do
    before { create(:user, :teacher, email: email, high_school: school, grade: nil) }

    it 'ActiveRecord::RecordInvalid を raise する' do
      expect { service.call }.to raise_error(ActiveRecord::RecordInvalid)
    end
  end
end
