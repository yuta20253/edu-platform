# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::CreateTeacherForm, type: :model do
  let!(:teacher_role) { create(:user_role, name: :teacher) }
  let!(:high_school) { create(:high_school) }

  let!(:current_user) do
    create(
      :user,
      user_role: teacher_role,
      high_school: high_school
    )
  end

  let!(:teacher_permission) do
    create(
      :teacher_permission,
      user: current_user,
      manage_other_teachers: true
    )
  end

  describe '#save' do
    subject { form.save }

    let(:form) do
      described_class.new(
        current_user: current_user,
        name: '山田 太郎',
        name_kana: 'ヤマダ タロウ',
        email: 'yamada@example.com',
        grade_scope: 1,
        manage_other_teachers: false
      )
    end

    context '入力値が正常な場合' do
      it '教員を新規作成できること' do
        expect { subject }.to change(User, :count).by(1)
                                                  .and change(TeacherPermission, :count).by(1)

        expect(subject).to be true

        created_user = User.find_by(email: 'yamada@example.com')

        expect(created_user).to be_present
        expect(created_user.name).to eq('山田 太郎')
        expect(created_user.name_kana).to eq('ヤマダ タロウ')
        expect(created_user.high_school).to eq(high_school)
        expect(created_user.user_role.name).to eq('teacher')

        expect(created_user.teacher_permission).to be_present
        expect(created_user.teacher_permission).to be_all_grades
        expect(created_user.teacher_permission.manage_other_teachers).to be(false)
      end
    end

    context 'nameが空の場合' do
      let(:form) do
        described_class.new(
          current_user: current_user,
          name: '',
          name_kana: 'ヤマダ タロウ',
          email: 'yamada@example.com',
          grade_scope: 1,
          manage_other_teachers: false
        )
      end

      it '保存できないこと' do
        expect(subject).to be false
        expect(form.errors[:name]).to be_present
      end
    end

    context 'name_kanaが空の場合' do
      let(:form) do
        described_class.new(
          current_user: current_user,
          name: '山田 太郎',
          name_kana: '',
          email: 'yamada@example.com',
          grade_scope: 1,
          manage_other_teachers: false
        )
      end

      it '保存できないこと' do
        expect(subject).to be false
        expect(form.errors[:name_kana]).to be_present
      end
    end

    context 'name_kanaがひらがなの場合' do
      let(:form) do
        described_class.new(
          current_user: current_user,
          name: '山田 太郎',
          name_kana: 'やまだ たろう',
          email: 'yamada@example.com',
          grade_scope: 1,
          manage_other_teachers: false
        )
      end

      it '保存できないこと' do
        expect(subject).to be false
        expect(form.errors[:name_kana]).to be_present
      end
    end

    context 'emailが空の場合' do
      let(:form) do
        described_class.new(
          current_user: current_user,
          name: '山田 太郎',
          name_kana: 'ヤマダ タロウ',
          email: '',
          grade_scope: 1,
          manage_other_teachers: false
        )
      end

      it '保存できないこと' do
        expect(subject).to be false
        expect(form.errors[:email]).to be_present
      end
    end

    context 'email形式が不正な場合' do
      let(:form) do
        described_class.new(
          current_user: current_user,
          name: '山田 太郎',
          name_kana: 'ヤマダ タロウ',
          email: 'abc',
          grade_scope: 1,
          manage_other_teachers: false
        )
      end

      it '保存できないこと' do
        expect(subject).to be false
        expect(form.errors[:email]).to be_present
      end
    end

    context 'emailが重複している場合' do
      let(:form) do
        described_class.new(
          current_user: current_user,
          name: '山田 太郎',
          name_kana: 'ヤマダ タロウ',
          email: current_user.email,
          grade_scope: 1,
          manage_other_teachers: false
        )
      end

      it '保存できないこと' do
        expect(subject).to be false
        expect(form.errors[:base]).to be_present
      end
    end

    context 'grade_scopeが不正な場合' do
      let(:form) do
        described_class.new(
          current_user: current_user,
          name: '山田 太郎',
          name_kana: 'ヤマダ タロウ',
          email: 'yamada@example.com',
          grade_scope: 999,
          manage_other_teachers: false
        )
      end

      it '保存できないこと' do
        expect(subject).to be false
        expect(form.errors[:grade_scope]).to be_present
      end
    end

    context 'manage_other_teachersがnilの場合' do
      let(:form) do
        described_class.new(
          current_user: current_user,
          name: '山田 太郎',
          name_kana: 'ヤマダ タロウ',
          email: 'yamada@example.com',
          grade_scope: 1,
          manage_other_teachers: nil
        )
      end

      it '保存できないこと' do
        expect(subject).to be false
        expect(form.errors[:manage_other_teachers]).to be_present
      end
    end
  end
end
