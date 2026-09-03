# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::CreateStudentForm, type: :model do
  subject(:form) do
    described_class.new(
      current_user: current_user,
      name: '山田 太郎',
      name_kana: 'ヤマダ タロウ',
      email: 'yamada@example.com',
      grade_id: grade_id,
      school_class_id: school_class_id
    )
  end

  let!(:student_role) { create(:user_role, name: :student) }
  let!(:high_school) { create(:high_school) }
  let!(:other_high_school) { create(:high_school) }

  let!(:grade) { create(:grade, high_school: high_school, year: 1) }
  let!(:other_grade) { create(:grade, high_school: high_school, year: 2) }
  let!(:other_school_grade) { create(:grade, high_school: other_high_school, year: 1) }

  let!(:school_class) { create(:school_class, grade: grade, name: 'A組') }
  let!(:other_grade_school_class) { create(:school_class, grade: other_grade, name: 'A組') }

  let!(:current_user) do
    create(:user, :teacher, high_school: high_school, grade: grade)
  end

  let!(:teacher_permission) do
    create(:teacher_permission, user: current_user, grade_scope: grade_scope)
  end

  let(:grade_scope) { :all_grades }
  let(:grade_id) { grade.id }
  let(:school_class_id) { school_class.id }

  describe '#valid?' do
    context '入力値が正常な場合' do
      it '有効であること' do
        expect(form.valid?).to be true
      end
    end

    context 'nameが空の場合' do
      subject(:form) do
        described_class.new(
          current_user: current_user, name: '', name_kana: 'ヤマダ タロウ', email: 'yamada@example.com',
          grade_id: grade_id, school_class_id: school_class_id
        )
      end

      it '無効であること' do
        expect(form.valid?).to be false
        expect(form.errors[:name]).to be_present
      end
    end

    context 'name_kanaがひらがなの場合' do
      subject(:form) do
        described_class.new(
          current_user: current_user, name: '山田 太郎', name_kana: 'やまだ たろう', email: 'yamada@example.com',
          grade_id: grade_id, school_class_id: school_class_id
        )
      end

      it '無効であること' do
        expect(form.valid?).to be false
        expect(form.errors[:name_kana]).to be_present
      end
    end

    context 'email形式が不正な場合' do
      subject(:form) do
        described_class.new(
          current_user: current_user, name: '山田 太郎', name_kana: 'ヤマダ タロウ', email: 'abc',
          grade_id: grade_id, school_class_id: school_class_id
        )
      end

      it '無効であること' do
        expect(form.valid?).to be false
        expect(form.errors[:email]).to be_present
      end
    end

    context 'grade_idが未指定の場合' do
      let(:grade_id) { nil }

      it '無効であること' do
        expect(form.valid?).to be false
        expect(form.errors[:grade_id]).to be_present
      end
    end

    context '存在しないgrade_idを指定した場合' do
      let(:grade_id) { 999_999 }

      it '無効であること' do
        expect(form.valid?).to be false
        expect(form.errors[:grade_id]).to be_present
      end
    end

    context '他校のgrade_idを指定した場合' do
      let(:grade_id) { other_school_grade.id }
      let(:school_class_id) { nil }

      it '無効であること' do
        expect(form.valid?).to be false
        expect(form.errors[:grade_id]).to be_present
      end
    end

    context '存在しないschool_class_idを指定した場合' do
      let(:school_class_id) { 999_999 }

      it '無効であること' do
        expect(form.valid?).to be false
        expect(form.errors[:school_class_id]).to be_present
      end
    end

    context 'grade_idとschool_class_idが一致しない場合' do
      let(:school_class_id) { other_grade_school_class.id }

      it '無効であること' do
        expect(form.valid?).to be false
        expect(form.errors[:school_class_id]).to be_present
      end
    end

    context 'own_gradeの教員が担当学年を指定した場合' do
      let(:grade_scope) { :own_grade }

      it '有効であること' do
        expect(form.valid?).to be true
      end
    end

    context 'own_gradeの教員が担当外学年を指定した場合' do
      let(:grade_scope) { :own_grade }
      let(:grade_id) { other_grade.id }
      let(:school_class_id) { other_grade_school_class.id }

      it '無効であること' do
        expect(form.valid?).to be false
        expect(form.errors[:grade_id]).to be_present
      end
    end
  end

  describe '#grade / #school_class' do
    it '指定したGrade/SchoolClassを解決すること' do
      expect(form.grade).to eq(grade)
      expect(form.school_class).to eq(school_class)
    end
  end

  describe '#save' do
    subject(:save) { form.save }

    context '入力値が正常な場合' do
      it '教員の所属高校に紐づく生徒を作成すること' do
        expect { save }.to change(User, :count).by(1)
                                               .and have_enqueued_mail(AuthMailer, :invite_user)

        expect(save).to be true

        student = User.find_by(email: 'yamada@example.com')

        expect(student).to be_present
        expect(student.name).to eq('山田 太郎')
        expect(student.name_kana).to eq('ヤマダ タロウ')
        expect(student.high_school).to eq(high_school)
        expect(student.grade).to eq(grade)
        expect(student.school_class).to eq(school_class)
        expect(student.user_role.name).to eq('student')
        expect(student.password_reset_required).to be true
        expect(student.student_number).to be_present
        expect(student.student_number).to start_with(high_school.school_code)
      end

      it 'form.studentで作成した生徒を取得できること' do
        save

        expect(form.student).to eq(User.find_by(email: 'yamada@example.com'))
      end
    end

    context '入力値が不正な場合' do
      let(:grade_id) { nil }

      it '生徒を作成せずfalseを返すこと' do
        expect { save }.not_to change(User, :count)

        expect(save).to be false
        expect(form.student).to be_nil
      end
    end

    context 'emailが重複している場合' do
      let!(:other_user) { create(:user, :student, high_school: high_school, email: 'yamada@example.com') }

      it '生徒を作成せずfalseを返すこと' do
        expect { save }.not_to change(User, :count)

        expect(save).to be false
        expect(form.errors[:base]).to be_present
      end
    end
  end
end
