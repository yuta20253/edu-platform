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
  let(:lock_version) { teacher.teacher_permission.lock_version }

  context '正常系 - grade_ids を指定した場合' do
    let(:params) { { grade_ids: [grade1.id, grade2.id], permission_lock_version: lock_version } }

    it 'TeacherGrade が差分更新される' do
      service.call
      expect(teacher.reload.grades.pluck(:id)).to contain_exactly(grade1.id, grade2.id)
    end
  end

  context '正常系 - grade_ids に他校の学年IDが含まれる場合' do
    let(:other_school) { create(:high_school) }
    let(:other_grade) { create(:grade, high_school: other_school, year: 1) }
    let(:params) { { grade_ids: [grade2.id, other_grade.id], permission_lock_version: lock_version } }

    it '対象教師の所属校に属する学年のみ TeacherGrade が更新される' do
      service.call
      expect(teacher.reload.grades.pluck(:id)).to contain_exactly(grade2.id)
    end
  end

  context '正常系 - grade_ids を省略した場合' do
    let(:params) { { name: '更新太郎', permission_lock_version: lock_version } }

    it '既存の TeacherGrade が変わらない' do
      service.call
      expect(teacher.reload.grades.pluck(:id)).to eq([grade1.id])
    end
  end

  context '正常系 - grade_scope を all_grades に変更し grade_ids で一部の学年のみ指定した場合' do
    let(:params) { { grade_scope: 'all_grades', grade_ids: [grade1.id], permission_lock_version: lock_version } }

    it '指定した grade_ids を無視して所属校の全学年で TeacherGrade が更新される' do
      service.call
      expect(teacher.reload.grades.pluck(:id)).to contain_exactly(grade1.id, grade2.id)
    end
  end

  context '正常系 - 既に grade_scope が all_grades の教師の grade_ids のみ更新した場合' do
    let!(:teacher) do
      user = create(:user, :teacher, high_school: school, grade: nil)
      create(:teacher_permission, user: user, grade_scope: :all_grades, manage_other_teachers: false)
      create(:teacher_grade, user: user, grade: grade1)
      user
    end
    let(:params) { { grade_ids: [grade1.id], permission_lock_version: lock_version } }

    it '指定した grade_ids を無視して所属校の全学年で TeacherGrade が更新される' do
      service.call
      expect(teacher.reload.grades.pluck(:id)).to contain_exactly(grade1.id, grade2.id)
    end
  end

  context '正常系 - permission_lock_version が最新で、権限を今と同じ値で送る場合' do
    let(:params) do
      { name: '更新太郎', grade_scope: 'own_grade', manage_other_teachers: false, permission_lock_version: lock_version }
    end

    it '名前が更新され、権限の lock_version は増えない' do
      expect { service.call }.not_to(change { teacher.teacher_permission.reload.lock_version })
      expect(teacher.reload.name).to eq('更新太郎')
    end
  end

  context '異常系 - permission_lock_version が古い場合' do
    let!(:stale_lock_version) { teacher.teacher_permission.lock_version }
    let!(:original_name) { teacher.name }
    let(:params) do
      { name: '更新太郎', grade_scope: 'own_grade', manage_other_teachers: false,
        permission_lock_version: stale_lock_version }
    end

    # 開いた後に、ほかの人が先に権限を変更した。
    # リクエストでは毎回読み直すので、キャッシュした teacher_permission も捨てて合わせる
    before do
      TeacherPermission.find_by!(user: teacher).update!(manage_other_teachers: true)
      teacher.reload
    end

    it 'ActiveRecord::StaleObjectError を raise し、名前の更新も取り消される' do
      expect { service.call }.to raise_error(ActiveRecord::StaleObjectError)
      expect(teacher.reload.name).to eq(original_name)
      expect(teacher.teacher_permission.reload.manage_other_teachers).to be(true)
    end
  end

  context '異常系 - email が重複している' do
    let(:params) { { email: 'duplicate@example.com', permission_lock_version: lock_version } }

    before { create(:user, :teacher, email: 'duplicate@example.com', high_school: school, grade: nil) }

    it 'ActiveRecord::RecordInvalid を raise する' do
      expect { service.call }.to raise_error(ActiveRecord::RecordInvalid)
    end
  end
end
