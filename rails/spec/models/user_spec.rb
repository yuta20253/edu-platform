# frozen_string_literal: true

# == Schema Information
#
# Table name: users
#
#  id                      :bigint           not null, primary key
#  email                   :string(255)      not null
#  encrypted_password      :string(255)      not null
#  reset_password_token    :string(255)
#  reset_password_sent_at  :datetime
#  remember_created_at     :datetime
#  name                    :string(100)
#  name_kana               :string(100)
#  user_role_id            :bigint
#  jti                     :string(255)      not null
#  deleted_at              :datetime
#  created_at              :datetime         not null
#  updated_at              :datetime         not null
#  high_school_id          :bigint
#  address_id              :bigint
#  grade_id                :bigint
#  password_reset_required :boolean          default(FALSE), not null
#  activated_at            :datetime
#  school_class_id         :bigint
#
require 'rails_helper'

RSpec.describe User, type: :model do
  let(:student_role) { create(:user_role, :student) }
  let(:admin_role) { create(:user_role, :admin) }
  let(:teacher_role) { create(:user_role, :teacher) }
  let(:guardian_role) { create(:user_role, :guardian) }
  let(:high_school) { create(:high_school, name: 'テスト高校') }
  let(:grade) { create(:grade) }

  describe 'バリデーション' do
    context 'nameとname_kana' do
      it '新規作成時は必須ではない' do
        user = described_class.new(email: 'test@example.com', password: 'password', user_role: student_role,
                                   high_school: high_school, grade: grade)
        expect(user.valid?).to be true
      end

      it '更新時は必須' do
        user = create(:user, email: 'test@example.com', password: 'password', user_role: student_role,
                             high_school: high_school)
        user.name = nil
        user.name_kana = nil

        expect(user.valid?).to be false
        expect(user.errors[:name]).to include('を入力してください')
        expect(user.errors[:name_kana]).to include('を入力してください')
      end

      it 'admin は更新時も name_kana が必須ではない（name は必須）' do
        user = create(:user, email: 'admin@example.com', password: 'password', user_role: admin_role,
                             high_school: nil, name_kana: nil)
        user.name_kana = nil

        expect(user.valid?(:update)).to be true
      end
    end

    describe 'user_role' do
      it { is_expected.to validate_presence_of(:user_role) }
    end

    describe '#school_class_belongs_to_grade' do
      let(:high_school) { create(:high_school) }
      let(:grade1) { create(:grade, high_school:) }
      let(:grade2) { create(:grade, high_school:) }

      let(:school_class) { create(:school_class, grade: grade1) }

      it '学年が一致していれば有効' do
        user = build(
          :user,
          user_role: student_role,
          high_school:,
          grade: grade1,
          school_class:
        )

        expect(user).to be_valid
      end

      it '学年が一致していなければ無効' do
        user = build(
          :user,
          user_role: student_role,
          high_school:,
          grade: grade2,
          school_class:
        )

        expect(user).to be_invalid
        expect(user.errors[:school_class]).to include('学年が一致しません')
      end
    end

    describe 'student_number' do
      it '生徒はstudent_numberを保持できる' do
        student = build(:user, user_role: student_role, high_school:, grade:, student_number: 'ABC12345')

        expect(student).to be_valid
      end

      it '生徒以外はstudent_numberを保持できない' do
        teacher = build(:user, user_role: teacher_role, high_school:, student_number: 'ABC12345')

        expect(teacher).to be_invalid
        expect(teacher.errors[:student_number]).to be_present
      end

      it 'student_numberが重複していると無効' do
        create(:user, user_role: student_role, high_school:, grade:, student_number: 'DUPLICATE1')
        student2 = build(:user, user_role: student_role, high_school:, grade:, student_number: 'DUPLICATE1')

        expect(student2).to be_invalid
        expect(student2.errors[:student_number]).to be_present
      end

      it 'student_numberがnilな生徒は複数存在できる' do
        create(:user, user_role: student_role, high_school:, grade:, student_number: nil)
        student2 = build(:user, user_role: student_role, high_school:, grade:, student_number: nil)

        expect(student2).to be_valid
      end
    end
  end

  describe '#generate_student_number' do
    let(:student) { create(:user, user_role: student_role, high_school:, grade:) }

    it '生徒であればschool_code+ランダム値のstudent_numberが生成される' do
      student.generate_student_number

      expect(student.student_number).to start_with(high_school.school_code)
      expect(student.student_number.length).to eq(high_school.school_code.length + 1 + 8)
    end

    it '生徒以外に対して呼ぶと例外になる' do
      teacher = create(:user, user_role: teacher_role, high_school:)

      expect { teacher.generate_student_number }.to raise_error(/生徒以外/)
    end

    it '生成されるstudent_numberは既存と衝突しない' do
      create(:user, user_role: student_role, high_school:, grade:,
                    student_number: "#{high_school.school_code}-AAAAAAAA")
      allow(SecureRandom).to receive(:alphanumeric).with(8).and_return('aaaaaaaa', 'bbbbbbbb')

      student.generate_student_number

      expect(student.student_number).to eq("#{high_school.school_code}-BBBBBBBB")
    end
  end
end
