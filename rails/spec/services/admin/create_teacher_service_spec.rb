# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::CreateTeacherService, type: :service do
  subject(:service) do
    described_class.new(
      school: school,
      name: name,
      email: email,
      password: password,
      grade_scope: grade_scope,
      manage_other_teachers: manage_other_teachers,
      grade_ids: grade_ids
    )
  end

  let!(:school) { create(:high_school) }
  let!(:grade) { create(:grade, high_school: school, year: 1) }
  let(:name) { '田中太郎' }
  let(:email) { 'tanaka@example.com' }
  let(:password) { 'abc123xyz' }
  let(:grade_scope) { 'own_grade' }
  let(:manage_other_teachers) { true }
  let(:grade_ids) { [grade.id] }

  context '正常系' do
    it 'User が作成される' do
      expect { service.call }.to change(User, :count).by(1)
    end

    it '指定した name が設定される' do
      service.call
      expect(User.find_by(email: email).name).to eq('田中太郎')
    end

    it '指定した password でログインできる' do
      service.call
      user = User.find_by(email: email)
      expect(user.valid_password?(password)).to be(true)
    end

    it '指定した grade_scope / manage_other_teachers で TeacherPermission が作成される' do
      service.call
      user = User.find_by(email: email)
      expect(user.teacher_permission.grade_scope).to eq('own_grade')
      expect(user.teacher_permission.manage_other_teachers).to be(true)
    end

    it '指定した grade_ids で TeacherGrade が作成される' do
      service.call
      user = User.find_by(email: email)
      expect(user.grades).to contain_exactly(grade)
    end

    it '招待メールを送信しない' do
      expect(AuthMailer).not_to receive(:invite_teacher)
      service.call
    end
  end

  context '異常系 - email が重複している' do
    before { create(:user, :teacher, email: email, high_school: school, grade: nil) }

    it 'ActiveRecord::RecordInvalid を raise する' do
      expect { service.call }.to raise_error(ActiveRecord::RecordInvalid)
    end
  end
end
