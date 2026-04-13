# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::UpdateTeacherService, type: :service do
  subject(:service) { described_class.new(user: teacher, params: params) }

  let!(:school) { create(:high_school) }
  let!(:grade1) { create(:grade, high_school: school, year: 1) }
  let!(:grade2) { create(:grade, high_school: school, year: 2) }
  let!(:teacher) do
    user = create(:user, :teacher, high_school: school, grade: nil)
    create(:teacher_permission, user: user, grade_scope: :own_grade, manage_other_teachers: false)
    create(:teacher_grade, user: user, grade: grade1)
    user
  end

  context '正常系 - grade_ids を指定した場合' do
    let(:params) { { grade_ids: [grade1.id, grade2.id] } }

    it 'TeacherGrade が差分更新される' do
      service.call
      expect(teacher.reload.grades.pluck(:id)).to contain_exactly(grade1.id, grade2.id)
    end
  end

  context '正常系 - grade_ids を省略した場合' do
    let(:params) { { name: '更新太郎' } }

    it '既存の TeacherGrade が変わらない' do
      service.call
      expect(teacher.reload.grades.pluck(:id)).to eq([grade1.id])
    end
  end

  context '正常系 - password と password_confirmation を指定した場合' do
    let(:params) { { password: 'newpassword123', password_confirmation: 'newpassword123' } }

    it 'パスワードが更新される' do
      service.call
      expect(teacher.reload.valid_password?('newpassword123')).to be(true)
    end
  end

  context '異常系 - password_confirmation なし' do
    let(:params) { { password: 'newpassword123' } }

    it 'ValidationError を raise する' do
      expect { service.call }.to raise_error(
        Admin::UpdateTeacherService::ValidationError,
        'パスワード確認を入力してください'
      )
    end
  end

  context '異常系 - email が重複している' do
    let(:params) { { email: 'duplicate@example.com' } }

    before { create(:user, :teacher, email: 'duplicate@example.com', high_school: school, grade: nil) }

    it 'ActiveRecord::RecordInvalid を raise する' do
      expect { service.call }.to raise_error(ActiveRecord::RecordInvalid)
    end
  end
end
