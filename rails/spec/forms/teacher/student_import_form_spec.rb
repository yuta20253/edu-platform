# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::StudentImportForm, type: :model do
  let(:high_school) { create(:high_school) }
  let(:grade) { create(:grade, high_school: high_school, year: 1) }
  let!(:school_class) { create(:school_class, grade: grade, name: 'A組') }

  def build_form(**overrides)
    described_class.new(
      {
        name: '山田太郎',
        name_kana: 'ヤマダタロウ',
        email: 'taro@example.com',
        grade_name: Grade::DISPLAY_NAMES[1],
        school_class_name: 'A組',
        high_school: high_school
      }.merge(overrides)
    )
  end

  describe '#valid?' do
    it '全項目が正しければ有効' do
      expect(build_form).to be_valid
    end

    it '氏名が空だと無効' do
      expect(build_form(name: '')).to be_invalid
    end

    it '氏名カナがカタカナでないと無効' do
      form = build_form(name_kana: 'やまだたろう')

      expect(form).to be_invalid
      expect(form.errors[:name_kana]).to include('はカタカナで入力してください')
    end

    it 'メールアドレスの形式が不正だと無効' do
      expect(build_form(email: 'invalid-email')).to be_invalid
    end

    it '学年が未入力だと無効' do
      expect(build_form(grade_name: '')).to be_invalid
    end

    it '学級が未入力だと無効' do
      expect(build_form(school_class_name: '')).to be_invalid
    end

    it '該当する学年が存在しないと無効' do
      form = build_form(grade_name: '存在しない学年')

      expect(form).to be_invalid
      expect(form.errors[:grade_name]).to include('に該当する学年が見つかりません')
    end

    it '該当する学級が存在しないと無効' do
      form = build_form(school_class_name: '存在しない学級')

      expect(form).to be_invalid
      expect(form.errors[:school_class_name]).to include('に該当する学級が見つかりません')
    end

    it '学級名は存在するが別の学年に紐づく場合は無効（学年・学級の不一致）' do
      other_grade = create(:grade, high_school: high_school, year: 2)
      create(:school_class, grade: other_grade, name: 'B組')

      form = build_form(grade_name: Grade::DISPLAY_NAMES[1], school_class_name: 'B組')

      expect(form).to be_invalid
      expect(form.errors[:school_class_name]).to include('に該当する学級が見つかりません')
    end

    it '他校の学年・学級は解決できず無効' do
      other_high_school = create(:high_school)

      form = build_form(high_school: other_high_school)

      expect(form).to be_invalid
      expect(form.errors[:grade_name]).to include('に該当する学年が見つかりません')
    end

    it 'CSV内で重複しているメールアドレスは無効' do
      form = build_form(duplicate_emails: Set.new(['taro@example.com']))

      expect(form).to be_invalid
      expect(form.errors[:email]).to include('がCSV内で重複しています')
    end

    it '他校のUserと同じメールアドレスは無効' do
      other_high_school = create(:high_school)
      create(:user, :student, email: 'taro@example.com', high_school: other_high_school,
                              grade: create(:grade, high_school: other_high_school))

      form = build_form

      expect(form).to be_invalid
      expect(form.errors[:email]).to include('は他の高校のアカウントで使用されています')
    end

    it '自校の既存Userと同じメールアドレスは有効（更新対象として扱う）' do
      create(:user, :student, email: 'taro@example.com', high_school: high_school, grade: grade)

      expect(build_form).to be_valid
    end

    context '教員の権限がown_grade（自分の担当学年のみ）の場合' do
      let(:teacher) { create(:user, :teacher, high_school: high_school, grade: grade) }

      before { create(:teacher_permission, user: teacher, grade_scope: :own_grade) }

      it '担当学年の生徒は有効' do
        expect(build_form(current_user: teacher)).to be_valid
      end

      it '他学年の生徒は無効' do
        other_grade = create(:grade, high_school: high_school, year: 2)
        create(:school_class, grade: other_grade, name: 'B組')

        form = build_form(current_user: teacher, grade_name: Grade::DISPLAY_NAMES[2], school_class_name: 'B組')

        expect(form).to be_invalid
        expect(form.errors[:grade_name]).to include('は担当学年ではないため登録できません')
      end
    end

    context '教員の権限がall_grades（全学年）の場合' do
      let(:teacher) { create(:user, :teacher, high_school: high_school, grade: grade) }

      before { create(:teacher_permission, user: teacher, grade_scope: :all_grades) }

      it '他学年の生徒でも有効' do
        other_grade = create(:grade, high_school: high_school, year: 2)
        create(:school_class, grade: other_grade, name: 'B組')

        form = build_form(current_user: teacher, grade_name: Grade::DISPLAY_NAMES[2], school_class_name: 'B組')

        expect(form).to be_valid
      end
    end
  end

  describe '#grade / #school_class' do
    it '有効な場合、対応するGrade/SchoolClassを取得できる' do
      form = build_form
      form.valid?

      expect(form.grade).to eq(grade)
      expect(form.school_class).to eq(school_class)
    end
  end

  describe '.duplicate_emails' do
    it 'CSV内で複数行に登場するメールアドレスだけを返す' do
      csv_content = <<~CSV
        氏名,氏名カナ,メール,学年,学級
        山田太郎,ヤマダタロウ,dup@example.com,#{Grade::DISPLAY_NAMES[1]},A組
        鈴木花子,スズキハナコ,unique@example.com,#{Grade::DISPLAY_NAMES[1]},A組
        佐藤次郎,サトウジロウ,dup@example.com,#{Grade::DISPLAY_NAMES[1]},A組
      CSV
      file = Tempfile.new(['students', '.csv'])
      file.write(csv_content)
      file.rewind

      expect(described_class.duplicate_emails(file.path)).to eq(Set.new(['dup@example.com']))
      file.close!
    end
  end

  describe '#existing_user' do
    it 'emailで既存Userを検索し、以後はメモ化して同じ結果を返す' do
      user = create(:user, :student, email: 'taro@example.com', high_school: high_school, grade: grade)
      form = build_form

      expect(form.existing_user).to eq(user)
      expect(form.existing_user).to equal(form.existing_user)
    end

    it '該当するUserがいなければnil' do
      expect(build_form.existing_user).to be_nil
    end
  end

  describe '.from_csv_row' do
    it 'CSVの行からフォームを組み立てられる' do
      row = {
        '氏名' => '山田太郎',
        '氏名カナ' => 'ヤマダタロウ',
        'メール' => 'taro@example.com',
        '学年' => Grade::DISPLAY_NAMES[1],
        '学級' => 'A組'
      }

      form = described_class.from_csv_row(row, high_school: high_school)

      expect(form).to be_valid
    end
  end
end
