# frozen_string_literal: true

module Teacher
  class StudentsQuery
    def initialize(relation)
      @relation = relation
    end

    def students
      @relation = @relation.active.includes(:grade, :address, :high_school,
                                            :user_personal_info).joins(:user_role).where(user_roles: { name: :student })
      self
    end

    def my_grade(grade_id)
      @relation = @relation.where(grade_id: grade_id)
      self
    end

    def search(keyword)
      keyword = keyword.to_s
      return self if keyword.blank?

      pattern = "%#{ActiveRecord::Base.sanitize_sql_like(keyword)}%"
      @relation = @relation.where('users.name LIKE :p OR users.name_kana LIKE :p', p: pattern)

      self
    end

    def result
      @relation
    end

    def call(grade_id: nil, keyword: nil)
      students
      my_grade(grade_id) if grade_id.present?
      search(keyword)
      result
    end
  end
end
