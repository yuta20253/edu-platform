# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::UpdatePermissionForm, type: :model do
  let!(:teacher_role) { create(:user_role, name: :teacher) }

  let!(:teacher) do
    create(
      :user,
      user_role: teacher_role
    )
  end

  let!(:teacher_permission) do
    create(
      :teacher_permission,
      user: teacher,
      grade_scope: :own_grade,
      manage_other_teachers: false
    )
  end

  describe '#valid?' do
    context '正常な値の場合' do
      subject do
        described_class.new(
          target: teacher,
          grade_scope: 'all_grades',
          manage_other_teachers: true
        )
      end

      it '有効であること' do
        expect(subject).to be_valid
      end
    end

    context 'grade_scopeが不正な場合' do
      subject do
        described_class.new(
          target: teacher,
          grade_scope: 'invalid',
          manage_other_teachers: true
        )
      end

      it '無効であること' do
        expect(subject).not_to be_valid
        expect(subject.errors[:grade_scope]).to be_present
      end
    end

    context 'manage_other_teachersがnilの場合' do
      subject do
        described_class.new(
          target: teacher,
          grade_scope: 'all_grades',
          manage_other_teachers: nil
        )
      end

      it '無効であること' do
        expect(subject).not_to be_valid
        expect(subject.errors[:manage_other_teachers]).to be_present
      end
    end
  end

  describe '#save' do
    subject do
      described_class.new(
        target: teacher,
        grade_scope: 'all_grades',
        manage_other_teachers: true,
        lock_version: lock_version
      )
    end

    let(:lock_version) { teacher_permission.lock_version }

    it 'teacher_permissionを更新できること' do
      expect(subject.save).to be(true)

      teacher_permission.reload

      expect(teacher_permission.grade_scope).to eq('all_grades')
      expect(teacher_permission.manage_other_teachers).to be(true)
    end

    context 'lock_versionが古い場合' do
      let!(:lock_version) { teacher_permission.lock_version }

      before { teacher_permission.update!(manage_other_teachers: true) }

      it 'StaleObjectErrorになり、値が変わらないこと' do
        expect { subject.save }.to raise_error(ActiveRecord::StaleObjectError)

        expect(teacher_permission.reload.grade_scope).to eq('own_grade')
      end
    end
  end
end
