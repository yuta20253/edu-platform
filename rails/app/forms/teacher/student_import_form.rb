# frozen_string_literal: true

module Teacher
  class StudentImportForm
    include ActiveModel::Model
    include ActiveModel::Attributes
    include ActiveModel::Validations
    include GradeScopeValidatable
    include NameKanaEmailValidatable
    include ExistingUserValidatable

    require 'csv'

    EMAIL_HEADER = 'メール'

    # CSVの列名・列順を定義する唯一の場所。
    # dry_run検証・実インポートはすべてこの定数を参照すること。
    HEADERS = %w[氏名 氏名カナ メール 学年 学級].freeze

    # HEADERSのうちCSVに必須の列。このフォームでは全項目が必須のためHEADERSと同じ。
    # ヘッダー行の妥当性チェック(Csv::HeaderValidator)で使う。
    REQUIRED_HEADERS = HEADERS

    attribute :name, :string
    attribute :name_kana, :string
    attribute :email, :string
    attribute :grade_name, :string
    attribute :school_class_name, :string

    attr_accessor :high_school, :duplicate_emails, :current_user

    validates :grade_name, presence: true
    validates :school_class_name, presence: true
    validate :grade_must_exist
    validate :school_class_must_exist
    validate :email_not_duplicated_in_csv

    def self.from_csv_row(row, high_school:, duplicate_emails: [], current_user: nil)
      new(
        name: row['氏名'],
        name_kana: row['氏名カナ'],
        email: row[EMAIL_HEADER],
        grade_name: row['学年'],
        school_class_name: row['学級'],
        high_school: high_school,
        duplicate_emails: duplicate_emails,
        current_user: current_user
      )
    end

    # CSV内でメールアドレスが複数行に渡って使われているものを、行番号を問わず1パスで集計する。
    # dry run・本実行のどちらも、行ごとのform構築の前にこれを呼んでform_contextへ渡す。
    def self.duplicate_emails(path)
      counts = Hash.new(0)

      CSV.foreach(path, headers: true, encoding: 'bom|utf-8') do |row|
        email = row[EMAIL_HEADER]&.strip
        counts[email] += 1 if email.present?
      end

      counts.select { |_email, count| count > 1 }.keys.to_set
    end

    # 学年表示名(Grade::DISPLAY_NAMES)から、high_school配下のGradeを解決する。
    # 見つからない場合はnil(エラーはgrade_must_existで積む)。
    def grade
      return @grade if defined?(@grade)
      return @grade = nil if grade_name.blank? || high_school.blank?

      year = Grade::DISPLAY_NAMES.index(grade_name)
      @grade = year && high_school.grades.find_by(year: year)
    end

    # gradeにスコープしてSchoolClassを解決するため、学年と学級の不一致も
    # 「このgrade配下にその学級名は存在しない」として自然にエラーになる。
    def school_class
      return @school_class if defined?(@school_class)
      return @school_class = nil if school_class_name.blank? || grade.blank?

      @school_class = grade.school_classes.find_by(name: school_class_name)
    end

    private

    def grade_must_exist
      return if grade_name.blank? || high_school.blank?

      errors.add(:grade_name, 'に該当する学年が見つかりません') if grade.nil?
    end

    def school_class_must_exist
      return if school_class_name.blank? || grade_name.blank? || high_school.blank?
      return if grade.nil? # grade自体が見つからない場合はgrade_must_existのエラーに任せる

      errors.add(:school_class_name, 'に該当する学級が見つかりません') if school_class.nil?
    end

    def grade_scope_error_attribute
      :grade_name
    end

    def email_not_duplicated_in_csv
      return if email.blank? || duplicate_emails.blank?

      errors.add(:email, 'がCSV内で重複しています') if duplicate_emails.include?(email.strip)
    end
  end
end
