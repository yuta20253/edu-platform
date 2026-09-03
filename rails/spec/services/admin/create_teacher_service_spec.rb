# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::CreateTeacherService, type: :service do
  subject(:service) do
    described_class.new(
      school: school,
      attributes: {
        name: name,
        email: email,
        grade_scope: grade_scope,
        manage_other_teachers: manage_other_teachers,
        grade_ids: grade_ids
      }
    )
  end

  let!(:school) { create(:high_school) }
  let!(:grade) { create(:grade, high_school: school, year: 1) }
  let(:name) { '田中太郎' }
  let(:email) { 'tanaka@example.com' }
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

    context 'grade_ids に他校の学年IDが含まれる場合' do
      let(:other_school) { create(:high_school) }
      let(:other_grade) { create(:grade, high_school: other_school, year: 1) }
      let(:grade_ids) { [grade.id, other_grade.id] }

      it '対象校に属する学年のみ TeacherGrade が作成される' do
        service.call
        user = User.find_by(email: email)
        expect(user.grades).to contain_exactly(grade)
      end
    end

    it '招待メールを送信する' do
      allow(AuthMailer).to receive(:invite_user).and_call_original
      service.call
      expect(AuthMailer).to have_received(:invite_user)
    end
  end

  context '異常系 - email が重複している' do
    before { create(:user, :teacher, email: email, high_school: school, grade: nil) }

    it 'ActiveRecord::RecordInvalid を raise する' do
      expect { service.call }.to raise_error(ActiveRecord::RecordInvalid)
    end
  end

  context '異常系 - name が空' do
    let(:name) { '' }

    it 'ActiveRecord::RecordInvalid を raise する' do
      expect { service.call }.to raise_error(ActiveRecord::RecordInvalid)
    end

    it 'User を作成しない' do
      expect { suppress(ActiveRecord::RecordInvalid) { service.call } }.not_to change(User, :count)
    end
  end
end
