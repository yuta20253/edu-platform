# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::StudentCsvImportService, type: :service do
  let!(:student_role) { create(:user_role, :student) }
  let!(:high_school) { create(:high_school) }
  let!(:grade) { create(:grade, high_school: high_school, year: 1) }
  let!(:school_class) { create(:school_class, grade: grade, name: 'A組') }

  def build_form(email:)
    form = Teacher::StudentImportForm.new(
      name: '山田太郎',
      name_kana: 'ヤマダタロウ',
      email: email,
      grade_name: Grade::DISPLAY_NAMES[1],
      school_class_name: 'A組',
      high_school: high_school
    )
    expect(form).to be_valid
    form
  end

  describe '#call' do
    context '該当するUserが存在しない場合' do
      let(:form) { build_form(email: 'new-student@example.com') }

      it '新規Userを作成する' do
        expect { described_class.new(form).call }.to change(User, :count).by(1)
      end

      it '所属高校・学年・学級・氏名が設定される' do
        user = described_class.new(form).call

        expect(user.high_school).to eq(high_school)
        expect(user.grade).to eq(grade)
        expect(user.school_class).to eq(school_class)
        expect(user.name).to eq('山田太郎')
      end

      it '生徒コードが発行される' do
        user = described_class.new(form).call

        expect(user.student_number).to match(/\A#{high_school.school_code}-/)
      end

      it 'password_reset_requiredがtrueになる（自己登録でclaim可能な状態）' do
        user = described_class.new(form).call

        expect(user.password_reset_required).to be true
      end
    end

    context '同じメールアドレスの自校Userが既に存在する場合' do
      let!(:existing_user) do
        create(:user, :student, :invitation_completed, email: 'existing@example.com',
                                                       high_school: high_school, grade: grade,
                                                       name: '旧名前', student_number: nil)
      end
      let(:form) { build_form(email: 'existing@example.com') }

      it '新規Userを作らず既存Userを更新する' do
        user = nil
        expect { user = described_class.new(form).call }.not_to change(User, :count)

        expect(user.id).to eq(existing_user.id)
        expect(user.name).to eq('山田太郎')
        expect(user.school_class).to eq(school_class)
      end

      it 'パスワードや有効化状態は上書きしない' do
        original_password = existing_user.encrypted_password

        described_class.new(form).call

        expect(existing_user.reload.encrypted_password).to eq(original_password)
        expect(existing_user.reload.password_reset_required).to be false
      end

      context 'student_numberが未設定の場合' do
        it '生徒コードが新たに発行される' do
          user = described_class.new(form).call

          expect(user.student_number).to be_present
        end
      end

      context 'student_numberが設定済みの場合' do
        before { existing_user.update!(student_number: "#{high_school.school_code}-EXISTING1") }

        it '既存の生徒コードが維持される' do
          user = described_class.new(form).call

          expect(user.student_number).to eq("#{high_school.school_code}-EXISTING1")
        end
      end
    end
  end
end
